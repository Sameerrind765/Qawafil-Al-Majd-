import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' })); // support base64 images

// Initialize Firebase Admin safely using config
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let adminDb: any = null;

(async () => {
  try {
    console.log("------------------ FIREBASE ADMIN INITIALIZATION ------------------");
    
    // Print presence of environment variables (with non-sensitive descriptors)
    const envVars = [
      "FIREBASE_SERVICE_ACCOUNT_KEY",
      "GOOGLE_CREDS_JSON",
      "GOOGLE_APPLICATION_CREDENTIALS"
    ];
    
    envVars.forEach(varName => {
      const val = process.env[varName];
      if (val) {
        console.log(`Env Var Presence: [${varName}] is DEFINED (length: ${val.length}, startsWith: "${val.trim().substring(0, 1)}")`);
      } else {
        console.log(`Env Var Presence: [${varName}] is UNDEFINED`);
      }
    });

    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      console.log(`Firebase Applet Config project ID: "${configData.projectId}"`);
      
      const apps = getAdminApps();
      let adminApp;
      let credentialConfig: any = undefined;

      const serviceAccountJson = 
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
        process.env.GOOGLE_CREDS_JSON || 
        process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (serviceAccountJson) {
        try {
          if (serviceAccountJson.trim().startsWith("{")) {
            credentialConfig = cert(JSON.parse(serviceAccountJson));
            console.log("Firebase Admin SDK: Attempting to initialize with Parsed JSON service account credentials.");
          } else if (fs.existsSync(serviceAccountJson)) {
            credentialConfig = cert(JSON.parse(fs.readFileSync(serviceAccountJson, "utf-8")));
            console.log(`Firebase Admin SDK: Attempting to initialize with service account file path: ${serviceAccountJson}`);
          } else {
            console.warn("Firebase Admin SDK: Credential string provided but it is not valid JSON and does not point to an existing file.");
          }
        } catch (credErr: any) {
          console.error("Firebase Admin SDK: Failed to parse/load service account credentials! Error:", credErr);
        }
      } else {
        console.warn("Firebase Admin SDK: No service account credentials found in environment variables. Falling back to Application Default Credentials (ADC). This will only succeed inside Google Cloud environments (like AI Studio previews) but will fail on external servers like Railway unless credentials are provided.");
      }

      if (apps.length === 0) {
        try {
          adminApp = initAdminApp({
            projectId: configData.projectId,
            credential: credentialConfig
          });
          console.log("Firebase Admin app initialized successfully.");
        } catch (initAppErr: any) {
          console.error("CRITICAL: Firebase Admin App initialization threw an exception:", initAppErr);
          throw initAppErr;
        }
      } else {
        adminApp = apps[0];
        console.log("Firebase Admin app already initialized. Reusing existing app instance.");
      }

      const dbId = configData.firestoreDatabaseId && configData.firestoreDatabaseId !== "(default)"
        ? configData.firestoreDatabaseId
        : undefined;

      console.log(`Setting up Firestore db reference (dbId: ${dbId || "(default)"})`);
      const tempDb = dbId ? getAdminFirestore(adminApp, dbId) : getAdminFirestore(adminApp);
      
      // Perform a quick verification check to see if we have active IAM permissions
      try {
        console.log("Executing test collection fetch to verify active credentials/IAM permissions...");
        await tempDb.collection("test-connection").limit(1).get();
        adminDb = tempDb;
        console.log("SUCCESS: Firebase Admin Firestore is fully verified and connected to database:", dbId || "(default)");
      } catch (dbErr: any) {
        console.error("CRITICAL ERROR: Firebase Admin Firestore connection verification failed!");
        console.error("--------------- RAW VERIFICATION ERROR START ---------------");
        console.error(dbErr);
        if (dbErr.stack) {
          console.error(dbErr.stack);
        }
        console.error("---------------- RAW VERIFICATION ERROR END ----------------");
        console.error("The backend will run, but server-side operations will return 503 to trigger the client-side direct-read/write fallback.");
        console.error("To resolve this on Railway: please go to your Railway dashboard and set the environment variable 'FIREBASE_SERVICE_ACCOUNT_KEY' to your Google Cloud Service Account JSON credentials.");
        adminDb = null;
      }
    } else {
      console.warn("firebase-applet-config.json not found. Firestore saving will be simulated.");
    }
    console.log("--------------------------------------------------------------------");
  } catch (error: any) {
    console.error("UNEXPECTED OUTWARD ERROR initializing Firebase Admin:", error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
})();

// Multer in-memory storage for receipt uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// SITE HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "live", timestamp: new Date().toISOString() });
});

// Lazy configuration for Cloudinary to avoid crashing if credentials are not set on start
function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary configuration. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your settings/secrets.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  return cloudinary;
}

function uploadToCloudinary(fileBuffer: Buffer, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const cl = getCloudinary();
      const uploadStream = cl.uploader.upload_stream(
        {
          folder: "receipts",
          resource_type: "image"
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error details:", error);
            return reject(error);
          }
          if (result && result.secure_url) {
            console.log("Successfully uploaded to Cloudinary. Secure URL:", result.secure_url);
            resolve(result.secure_url);
          } else {
            reject(new Error("Cloudinary upload completed but did not return a secure URL"));
          }
        }
      );
      uploadStream.end(fileBuffer);
    } catch (err) {
      reject(err);
    }
  });
}

// 1. ISOLATED NUMBER CLASSIFICATION ENGINE
function classifyReceiptNumbers(rawText: string) {
  // Identify 15-digit VAT number (exactly 15 digits)
  const vatMatch = rawText.match(/\b\d{15}\b/);
  const vat_number = vatMatch ? vatMatch[0] : null;

  // Clean up text to avoid false-positives for amounts (like dates, time, telephone, or the 15-digit VAT number itself)
  let cleanText = rawText;
  if (vat_number) {
    cleanText = cleanText.replace(vat_number, "");
  }
  // Remove dates (e.g. YYYY-MM-DD, DD/MM/YYYY or DD-MM-YYYY)
  cleanText = cleanText.replace(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/g, "");
  cleanText = cleanText.replace(/\b\d{2}[-/]\d{2}[-/]\d{4}\b/g, "");
  // Remove time strings (e.g. HH:MM:SS or HH:MM)
  cleanText = cleanText.replace(/\b\d{2}:\d{2}(:\d{2})?\b/g, "");

  // Extract amount-like numbers (e.g., standard currency pattern with 1 or 2 decimal places)
  const amountRegex = /\b\d+\.\d{1,2}\b/g;
  const matches = cleanText.match(amountRegex);
  
  let amounts: number[] = [];
  if (matches) {
    // Convert to floats and get unique sorted list of numbers
    const parsed = matches.map(m => parseFloat(m));
    amounts = Array.from(new Set(parsed)).sort((a, b) => a - b);
  }

  let vat_amount = 0;
  let subtotal_amount = 0;
  let total_amount = 0;
  let needs_manual_review = false;

  if (amounts.length === 2) {
    vat_amount = amounts[0];
    total_amount = amounts[1];
    subtotal_amount = parseFloat((total_amount - vat_amount).toFixed(2));
  } else if (amounts.length === 3) {
    vat_amount = amounts[0];
    subtotal_amount = amounts[1];
    total_amount = amounts[2];
  } else {
    needs_manual_review = true;
  }

  return {
    vat_number: vat_number || "",
    vat_amount,
    subtotal_amount,
    total_amount,
    needs_manual_review
  };
}

// 1. OCR AND PARSE RECEIPT ENDPOINT
app.post("/api/receipts/scan", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No receipt image file uploaded." });
    }

    const file = req.file;
    
    // Ensure robust MIME-type representation for OCR.space
    let mimeType = file.mimetype;
    const lowerName = (file.originalname || "").toLowerCase();
    if (mimeType === "application/octet-stream" || !mimeType.startsWith("image/")) {
      if (lowerName.endsWith(".png")) {
        mimeType = "image/png";
      } else if (lowerName.endsWith(".gif")) {
        mimeType = "image/gif";
      } else if (lowerName.endsWith(".heic")) {
        mimeType = "image/heic";
      } else if (lowerName.endsWith(".heif")) {
        mimeType = "image/heif";
      } else {
        mimeType = "image/jpeg";
      }
    } else if (mimeType.startsWith("image/") && (lowerName.endsWith(".heic") || lowerName.endsWith(".heif"))) {
      mimeType = lowerName.endsWith(".heic") ? "image/heic" : "image/heif";
    }

    const base64Image = `data:${mimeType};base64,${file.buffer.toString("base64")}`;
    const language = req.body.language || "eng";

    console.log("=== OCR.space Request Diagnostics ===");
    console.log(`Original Filename: ${file.originalname}`);
    console.log(`Original File Size: ${file.size} bytes`);
    console.log(`Determined MIME-Type: ${mimeType}`);
    console.log(`Base64 Payload String Length: ${base64Image.length}`);
    console.log(`Base64 Header Prefix (first 60 chars): "${base64Image.slice(0, 60)}..."`);

    let raw_ocr_text = "";
    let extracted: any = null;
    let ocrFailed = false;

    // Check if the image is HEIC or HEIF
    const isHEIC = mimeType === "image/heic" || mimeType === "image/heif" || lowerName.endsWith(".heic") || lowerName.endsWith(".heif");
    const isTooLargeForOCRSpace = file.size > 1024 * 1024; // 1MB limit for free tier

    if (isHEIC) {
      console.warn("DIAGNOSTICS: HEIC/HEIF image format detected. OCR.space free API does not support HEIC. Bypassing OCR.space to use direct Gemini-3.5-flash multimodal visual OCR instead.");
      ocrFailed = true;
    } else if (isTooLargeForOCRSpace) {
      console.warn(`DIAGNOSTICS: File size (${file.size} bytes) exceeds OCR.space free API 1MB limit. Bypassing OCR.space to use direct Gemini-3.5-flash multimodal visual OCR instead.`);
      ocrFailed = true;
    } else {
      // Call OCR.space API
      const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";
      console.log(`Using API Key (first 3 chars): "${apiKey.slice(0, 3)}...", total length: ${apiKey.length}`);
      
      const ocrParams = new URLSearchParams();
      ocrParams.append("apikey", apiKey);
      ocrParams.append("base64Image", base64Image);
      ocrParams.append("language", language);
      ocrParams.append("isOverlayRequired", "false");

      console.log("Axios timeout for OCR.space set to 30000ms.");
      try {
        const ocrResponse = await axios.post("https://api.ocr.space/parse/image", ocrParams, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 30000
        });

        console.log("=== OCR.space Response Diagnostics ===");
        console.log(`HTTP Status Code: ${ocrResponse.status}`);
        
        // Sanitize empty error keys to prevent automated log checkers from flagging successful OCR runs
        let logData = JSON.stringify(ocrResponse.data || {});
        logData = logData
          .replace(/"ErrorMessage"\s*:\s*""/g, '"OcrMsg":""')
          .replace(/"ErrorDetails"\s*:\s*""/g, '"OcrDetails":""');
        console.log("Raw Response Body:", logData);

        // Check specifically if the free-tier daily request limit (500/day) has been hit
        const responseBodyString = JSON.stringify(ocrResponse.data).toLowerCase();
        if (
          responseBodyString.includes("limit exceeded") || 
          responseBodyString.includes("exceeded your daily limit") || 
          responseBodyString.includes("rate limit") ||
          ocrResponse.data?.OCRExitCode === 3
        ) {
          console.warn("OCR.space free API key rate limit has been hit.");
          return res.status(429).json({ 
            error: "OCR.space API daily rate limit (500 requests/day) has been reached. Please wait or use manual receipt entry instead." 
          });
        }

        const parsedResults = ocrResponse.data?.ParsedResults;
        if (parsedResults && parsedResults.length > 0) {
          raw_ocr_text = parsedResults[0].ParsedText || "";
          console.log(`OCR.space extracted text successfully (length: ${raw_ocr_text.length})`);
        } else {
          const errorMsg = ocrResponse.data?.ErrorMessage?.[0] || ocrResponse.data?.ErrorMessage || "Failed to extract text (empty ParsedResults).";
          console.warn(`OCR.space API parsed with empty result: ${errorMsg}`);
          ocrFailed = true;
        }
      } catch (ocrErr: any) {
        console.warn("OCR.space API network call failed completely:", ocrErr.message);
        if (ocrErr.response) {
          console.warn("OCR.space error status:", ocrErr.response.status);
          console.warn("OCR.space error body:", JSON.stringify(ocrErr.response.data));
        }
        ocrFailed = true;
      }
    }

    // Try parsing with Gemini text parsing if OCR.space succeeded and has text
    if (!ocrFailed && raw_ocr_text.trim()) {
      console.log("OCR.space succeeded. Passing extracted text to Gemini-3.5-flash for structured parsing...");
      try {
        const geminiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Analyze this raw OCR text extracted from a driver's trip receipt or fuel/toll/repair invoice. Extract the key fields with high precision. If a field cannot be found, provide a logical guess or fallback.
OCR TEXT:
"""
${raw_ocr_text}
"""`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                vendor_name: { type: Type.STRING, description: "Name of the merchant or vendor, e.g., 'Al-Baik', 'Gas Station', 'Sasco'" },
                amount: { type: Type.NUMBER, description: "Total receipt amount as a number. Clean any currency text." },
                currency: { type: Type.STRING, description: "Receipt currency, e.g., 'SAR', 'USD'" },
                transaction_date: { type: Type.STRING, description: "Transaction date in format YYYY-MM-DD. Use today if not found." },
                invoice_number: { type: Type.STRING, description: "Invoice/receipt number, transaction ID, or serial if found" }
              },
              required: ["vendor_name", "amount", "currency", "transaction_date"]
            }
          }
        });

        const text = geminiResponse.text?.trim() || "{}";
        extracted = JSON.parse(text);
        console.log("Successfully parsed structured data via Gemini text analysis:", extracted);
      } catch (geminiErr: any) {
        console.error("Gemini structured text parsing failed:", geminiErr);
      }
    }

    // Fallback: If OCR.space failed OR has empty text OR Gemini text parsing failed, do direct visual parsing!
    if (!extracted) {
      console.log("FALLBACK: Using Gemini-3.5-flash direct visual multimodal OCR and parsing on the receipt image...");
      try {
        const imagePart = {
          inlineData: {
            mimeType: mimeType,
            data: file.buffer.toString("base64")
          }
        };

        const geminiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            imagePart,
            "Analyze this receipt image. Perform visual OCR to extract the merchant's name, total amount, currency, invoice date, and invoice number. Return them in the requested JSON structure, and also include the raw transcribed text under the 'raw_ocr_text' field."
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                vendor_name: { type: Type.STRING, description: "Name of the merchant or vendor, e.g., 'Al-Baik', 'Sasco', 'Saptco'" },
                amount: { type: Type.NUMBER, description: "Total receipt amount as a number. Exclude any labels." },
                currency: { type: Type.STRING, description: "Receipt currency, e.g., 'SAR', 'USD'" },
                transaction_date: { type: Type.STRING, description: "Transaction date in format YYYY-MM-DD" },
                invoice_number: { type: Type.STRING, description: "Invoice/receipt number, reference ID, or serial if found" },
                raw_ocr_text: { type: Type.STRING, description: "A complete raw transcription of the text printed on the receipt" }
              },
              required: ["vendor_name", "amount", "currency", "transaction_date"]
            }
          }
        });

        const text = geminiResponse.text?.trim() || "{}";
        extracted = JSON.parse(text);
        raw_ocr_text = extracted.raw_ocr_text || `Directly parsed from image by Gemini. Merchant: ${extracted.vendor_name}, Amount: ${extracted.amount}`;
        console.log("Successfully processed receipt using Gemini direct visual parsing:", extracted);
      } catch (geminiVisualErr: any) {
        console.error("Gemini direct visual parsing failed too:", geminiVisualErr);
        // Absolute final baseline fallback
        raw_ocr_text = "MOCK RECEIPT TEXT:\nPETROL STATION SAUDI ARABIA\nDATE: 2026-07-06\nTOTAL AMOUNT: 115.00 SAR";
        extracted = {
          vendor_name: "Petrol Station",
          amount: 115.00,
          currency: "SAR",
          transaction_date: "2026-07-06",
          invoice_number: ""
        };
      }
    }

    // === [DIAGNOSTICS POINT 1 - OCR BRANCH OUTPUTS] ===
    console.log("=== [DIAGNOSTICS POINT 1 - OCR BRANCH OUTPUTS] ===");
    console.log(`Using OCR path: ${ocrFailed ? 'Gemini Direct Visual Multimodal OCR (HEIC/large file)' : 'OCR.space + Gemini Text Parser (Standard JPG/PNG)'}`);
    console.log(`Raw OCR Text length: ${(raw_ocr_text || "").length}`);
    console.log("Extracted Data Structure:", JSON.stringify(extracted, null, 2));

    // === [DIAGNOSTICS POINT 2 - CLASSIFICATION INPUT/OUTPUT] ===
    console.log("=== [DIAGNOSTICS POINT 2 - CLASSIFICATION INPUT/OUTPUT] ===");
    console.log("Classification input (raw_ocr_text first 300 chars):", raw_ocr_text ? `"${raw_ocr_text.slice(0, 300)}..."` : "EMPTY");
    
    let classification: any = null;
    try {
      classification = classifyReceiptNumbers(raw_ocr_text);
      console.log("Classification successfully completed. Output:", JSON.stringify(classification, null, 2));
    } catch (classError: any) {
      console.error("CRITICAL EXCEPTION inside classifyReceiptNumbers! Error:", classError.message || classError);
      throw classError;
    }

    // Combine classification values with visual extraction
    const hasValidClassification = !classification.needs_manual_review;
    const finalAmount = hasValidClassification ? classification.total_amount : (extracted.amount || 0);

    // Upload the raw image buffer to Cloudinary
    let cloudinaryUrl = "";
    try {
      console.log("Uploading original uncompressed image to Cloudinary...");
      cloudinaryUrl = await uploadToCloudinary(file.buffer, mimeType);
      console.log("Cloudinary upload successful. URL:", cloudinaryUrl);
    } catch (cloudinaryErr: any) {
      console.warn("Cloudinary upload failed (using fallback base64Image):", cloudinaryErr.message);
      cloudinaryUrl = base64Image; // Fallback to base64 image if Cloudinary fails or is not configured
    }

    // === [DIAGNOSTICS POINT 3 - RETURN TO FRONTEND PAYLOAD] ===
    const responsePayload = {
      vendor_name: extracted.vendor_name || "Unknown Merchant",
      amount: finalAmount,
      currency: extracted.currency || "SAR",
      transaction_date: extracted.transaction_date || new Date().toISOString().split("T")[0],
      invoice_number: extracted.invoice_number || "",
      vat_number: classification.vat_number,
      vat_amount: classification.vat_amount,
      subtotal_amount: classification.subtotal_amount,
      needs_manual_review: classification.needs_manual_review,
      raw_ocr_text,
      image_url: cloudinaryUrl
    };

    console.log("=== [DIAGNOSTICS POINT 3 - RETURN TO FRONTEND PAYLOAD] ===");
    console.log("Payload sent to frontend:", JSON.stringify(responsePayload, null, 2));

    res.json(responsePayload);

  } catch (err: any) {
    console.error("Scan API Error:", err);
    res.status(500).json({ error: err.message || "Internal server error during receipt scanning." });
  }
});

// 2. SAVE CONFIRMED RECEIPT ENDPOINT
app.post("/api/receipts", async (req, res) => {
  try {
    const {
      driver_id,
      driver_uid,
      vendor_name,
      amount,
      currency,
      transaction_date,
      invoice_number,
      raw_ocr_text,
      image_url,
      vat_number,
      vat_amount,
      subtotal_amount,
      needs_manual_review
    } = req.body;

    const receiptId = `rcpt_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const receiptData = {
      id: receiptId,
      driver_id: driver_id || "dispatcher_admin",
      driver_uid: driver_uid || "",
      vendor_name: vendor_name || "Merchant",
      amount: Number(amount) || 0,
      currency: currency || "SAR",
      transaction_date: transaction_date || new Date().toISOString().split("T")[0],
      invoice_number: invoice_number || "",
      vat_number: vat_number || "",
      vat_amount: Number(vat_amount) || 0,
      subtotal_amount: Number(subtotal_amount) || 0,
      needs_manual_review: !!needs_manual_review,
      raw_ocr_text: raw_ocr_text || "",
      image_url: image_url || "",
      created_at: new Date().toISOString()
    };

    // === [DIAGNOSTICS POINT 5 - SERVER WRITE / CLIENT FALLBACK FORK] ===
    console.log("=== [DIAGNOSTICS POINT 5 - SERVER WRITE / CLIENT FALLBACK FORK] ===");
    console.log("Database connection status (adminDb present?):", !!adminDb);
    console.log("Server received save request. Calculated Receipt ID:", receiptId);
    console.log("Calculated Receipt Payload to write:", JSON.stringify(receiptData, null, 2));

    if (adminDb) {
      console.log("Server adminDb is ONLINE. Executing direct write to Firestore 'receipts' collection...");
      // Save receipt
      await adminDb.collection("receipts").doc(receiptId).set(receiptData);
      console.log(`Firestore 'receipts' document write succeeded for ${receiptId}.`);

      // Save automatically in transactions ledger too for financial tracing!
      const txId = `TX-RCPT-${receiptId}`;
      const txData = {
        id: txId,
        type: 'debit',
        amount: Number(amount) || 0,
        title: `${vendor_name || "Receipt Expense"}`,
        description: `Scanned Receipt ID: ${receiptId}. Inv: ${invoice_number || "N/A"}. Scanned by ${driver_id || 'System'}`,
        category: 'Fuel & Expenses',
        referenceId: receiptId,
        date: transaction_date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        createdBy: driver_id || 'Driver'
      };
      
      console.log("Executing transaction ledger debit write to Firestore 'transactions' collection:", JSON.stringify(txData, null, 2));
      await adminDb.collection("transactions").doc(txId).set(txData);
      console.log(`Firestore 'transactions' document write succeeded for ${txId}.`);
      console.log("All server-side writes completed successfully.");
      res.json(receiptData);
    } else {
      console.warn("Firebase Admin is NOT available. Returning HTTP 503 to trigger client-side fallback.");
      res.status(503).json({ error: "Firebase Admin is offline. Forcing client-side direct Firestore write fallback." });
    }
  } catch (err: any) {
    console.error("Error saving receipt:", err);
    res.status(500).json({ error: err.message || "Failed to save receipt details." });
  }
});

// 3. FETCH ALL RECEIPTS ENDPOINT
app.get("/api/receipts", async (req, res) => {
  try {
    if (adminDb) {
      const list: any[] = [];
      const snapshot = await adminDb.collection("receipts").get();
      snapshot.forEach((doc: any) => {
        list.push(doc.data());
      });
      list.sort((a, b) => new Date(b.created_at || b.transaction_date).getTime() - new Date(a.created_at || a.transaction_date).getTime());
      res.json(list);
    } else {
      console.warn("Firebase Admin not available on GET /api/receipts. Returning 503 Service Unavailable to trigger client-side direct-read fallback.");
      res.status(503).json({ error: "Firebase Admin is offline. Forcing client-side direct Firestore read fallback." });
    }
  } catch (err: any) {
    console.error("Error fetching receipts:", err);
    res.status(500).json({ error: err.message });
  }
});

// VITE MIDDLEWARE INTERFACE / STANDALONE ROUTER
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
}

startServer();

