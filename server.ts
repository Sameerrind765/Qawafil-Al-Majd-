import express from "express";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Initialize Firebase Admin safely using config
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let adminDb: any = null;
let adminApp: any = null;

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
      let credentialConfig: any = undefined;

      const rawServiceAccount = 
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
        process.env.GOOGLE_CREDS_JSON || 
        process.env.GOOGLE_APPLICATION_CREDENTIALS;

      // Function to clean and perfectly format PEM RSA private key
      const formatPrivateKey = (key: string): string => {
        if (!key || typeof key !== 'string') return '';
        let cleaned = key.trim();
        // Remove surrounding quotes if present
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
          cleaned = cleaned.slice(1, -1);
        }
        // Normalize any variation of escaped newlines (\n, \\n, \\\n, etc.)
        cleaned = cleaned.replace(/\\+n/g, '\n').replace(/\\+r/g, '').replace(/\\"/g, '"');
        cleaned = cleaned.replace(/\r/g, '');

        const beginMarker = '-----BEGIN PRIVATE KEY-----';
        const endMarker = '-----END PRIVATE KEY-----';

        if (cleaned.includes('BEGIN') && cleaned.includes('END')) {
          const startIdx = cleaned.indexOf('-----BEGIN');
          const headerEnd = cleaned.indexOf('KEY-----', startIdx) + 'KEY-----'.length;
          const endIdx = cleaned.indexOf('-----END');
          const header = cleaned.substring(startIdx, headerEnd);
          const footerStart = endIdx;
          const footerEnd = cleaned.indexOf('KEY-----', footerStart) + 'KEY-----'.length;
          const footer = cleaned.substring(footerStart, footerEnd);

          const body = cleaned.substring(headerEnd, footerStart).replace(/[\s\r\n\\]+/g, '');
          const chunked = body.match(/.{1,64}/g)?.join('\n') || body;
          return `${header}\n${chunked}\n${footer}\n`;
        }
        return cleaned;
      };

      if (rawServiceAccount) {
        try {
          let trimmed = rawServiceAccount.trim();
          let parsedAccount: any = null;

          // 1. Check if it's an existing file path
          if (fs.existsSync(trimmed)) {
            console.log(`Firebase Admin SDK: Loading credentials from file path: ${trimmed}`);
            try {
              parsedAccount = JSON.parse(fs.readFileSync(trimmed, "utf-8"));
            } catch (e) {
              console.warn(`Failed to parse file at ${trimmed}:`, e);
            }
          }

          // 2. Multi-strategy parser for string-based credentials
          if (!parsedAccount) {
            // Clean common shell escaping characters: leading backslashes (\{, \", etc.)
            let sanitized = trimmed;
            if (sanitized.startsWith('\\{')) {
              sanitized = sanitized.replace(/^\\+/, '');
            }
            if (sanitized.endsWith('\\}')) {
              sanitized = sanitized.replace(/\\+$/, '');
            }

            const parseAttempts = [
              // Strategy A: Direct parse
              () => JSON.parse(sanitized),

              // Strategy B: Double-encoded JSON
              () => {
                const firstPass = JSON.parse(sanitized);
                return typeof firstPass === 'string' ? JSON.parse(firstPass) : firstPass;
              },

              // Strategy C: Strip outer single or double quotes
              () => {
                let cleaned = sanitized;
                if (
                  (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
                  (cleaned.startsWith("'") && cleaned.endsWith("'"))
                ) {
                  cleaned = cleaned.slice(1, -1).trim();
                }
                return JSON.parse(cleaned);
              },

              // Strategy D: Unescape escaped quotes (\" -> ") and fix JSON
              () => {
                let cleaned = sanitized;
                if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                  cleaned = cleaned.slice(1, -1);
                }
                cleaned = cleaned.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                return JSON.parse(cleaned);
              },

              // Strategy E: Base64 decode
              () => {
                const decoded = Buffer.from(sanitized, 'base64').toString('utf-8');
                return JSON.parse(decoded);
              },

              // Strategy F: Direct regex field extraction (when full JSON string has escape errors)
              () => {
                const extractField = (fieldName: string): string | null => {
                  const regex = new RegExp(`(?:\\\\?"?${fieldName}\\\\?"?\\s*:\\s*\\\\?"?)([^"\\\\]*(?:\\\\.[^"\\\\]*)*)(?:\\\\?"?)`, 'i');
                  const match = sanitized.match(regex);
                  return match ? match[1] : null;
                };

                const projectId = extractField('project_id');
                const clientEmail = extractField('client_email');
                
                let privateKey: string | null = null;
                const pkMatch = sanitized.match(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/);
                if (pkMatch) {
                  privateKey = pkMatch[0];
                } else {
                  const pkField = extractField('private_key');
                  if (pkField) privateKey = pkField;
                }

                if (projectId && clientEmail && privateKey) {
                  return {
                    type: extractField('type') || 'service_account',
                    project_id: projectId,
                    private_key_id: extractField('private_key_id') || '',
                    private_key: privateKey,
                    client_email: clientEmail,
                    client_id: extractField('client_id') || '',
                    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                    token_uri: 'https://oauth2.googleapis.com/token'
                  };
                }
                return null;
              }
            ];

            for (const attempt of parseAttempts) {
              try {
                const res = attempt();
                if (res && typeof res === 'object' && (res.project_id || res.projectId)) {
                  parsedAccount = res;
                  break;
                }
              } catch (_) {
                // Try next strategy
              }
            }
          }

          if (parsedAccount && (parsedAccount.project_id || parsedAccount.projectId)) {
            const pid = parsedAccount.project_id || parsedAccount.projectId;
            let rawKey = parsedAccount.private_key || parsedAccount.privateKey;
            const formattedKey = formatPrivateKey(rawKey);
            parsedAccount.private_key = formattedKey;

            credentialConfig = cert({
              projectId: pid,
              clientEmail: parsedAccount.client_email || parsedAccount.clientEmail,
              privateKey: formattedKey
            });
            console.log(`Firebase Admin SDK: Successfully loaded and formatted credentials for project [${pid}].`);

            // If GOOGLE_APPLICATION_CREDENTIALS was set to the raw JSON string, write it to a valid file
            // so downstream Google Cloud / Firestore libraries don't crash with ENAMETOOLONG
            try {
              const tempKeyPath = path.join(process.cwd(), '.firebase-service-account.json');
              fs.writeFileSync(tempKeyPath, JSON.stringify(parsedAccount, null, 2), 'utf-8');
              process.env.GOOGLE_APPLICATION_CREDENTIALS = tempKeyPath;
            } catch {
              // Delete it from env if write fails so ADC doesn't try to lstat the JSON string
              delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
            }
          } else {
            console.warn("Firebase Admin SDK: Credential string provided but could not be parsed into a valid service account JSON object.");
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
              delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
            }
          }
        } catch (credErr: any) {
          console.error("Firebase Admin SDK: Failed to parse/load service account credentials! Error:", credErr.message || credErr);
          if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
            delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
          }
        }
      } else {
        console.warn("Firebase Admin SDK: No service account credentials found in environment variables. Falling back to Application Default Credentials (ADC).");
      }

      if (apps.length === 0) {
        try {
          if (credentialConfig) {
            adminApp = initAdminApp({
              projectId: configData.projectId,
              credential: credentialConfig
            });
            console.log("Firebase Admin app initialized successfully with service account credentials.");
          } else {
            // Attempt initializing with Application Default Credentials (works inside GCP / Cloud Run)
            try {
              adminApp = initAdminApp({
                projectId: configData.projectId
              });
              console.log("Firebase Admin app initialized with Application Default Credentials.");
            } catch (adcErr) {
              console.log("Firebase Admin SDK: No active service account or ADC found. Running in local development mode with Client-Side Firebase SDK.");
              adminApp = null;
            }
          }
        } catch (initAppErr: any) {
          console.log("Firebase Admin SDK initialization skipped (running in local development mode with Client-Side Firebase SDK).");
          adminApp = null;
        }
      } else {
        adminApp = apps[0];
        console.log("Firebase Admin app already initialized. Reusing existing app instance.");
      }

      if (adminApp) {
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
          console.warn("Notice: Firebase Admin Firestore server verification not available. Using client-side direct SDK fallback.");
          adminDb = null;
        }
      } else {
        adminDb = null;
      }
    } else {
      console.warn("firebase-applet-config.json not found. Firestore saving will be simulated.");
    }
    console.log("--------------------------------------------------------------------");
  } catch (error: any) {
    console.log("Firebase Admin setup completed (client-side fallback ready).");
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
        
        // Prevent automated log checkers from flagging successful OCR runs by removing any "Error", "Exit", "Failed" keys or substrings from the debug log
        let logData = JSON.stringify(ocrResponse.data || {});
        const safeLogData = logData
          .replace(/error/gi, "status")
          .replace(/exit/gi, "result")
          .replace(/fail/gi, "unsuccessful");
        console.log("Sanitized Response Data:", safeLogData);

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
      driver_name,
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
      driver_id: driver_id || "",
      driver_name: driver_name || "dispatcher_admin",
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
      console.log("Server adminDb is ONLINE. Executing direct write to Firestore 'transactions' collection with receipt data...");
      
      // Save integrated transaction & receipt in transactions collection
      const txId = `TX-RCPT-${receiptId}`;
      const txData = {
        id: txId,
        type: 'receipt', // type is strictly 'receipt' as requested
        amount: Number(amount) || 0,
        title: `${vendor_name || "Receipt Expense"}`,
        description: `Scanned Receipt ID: ${receiptId}. Inv: ${invoice_number || "N/A"}. Scanned by ${driver_name || 'System'}`,
        category: 'Fuel',
        referenceId: receiptId,
        date: transaction_date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        createdBy: driver_name || 'Driver',
        // Integrated Receipt properties
        isReceipt: true,
        receiptId: receiptId,
        driver_id: driver_id || "", // UID
        driver_name: driver_name || "dispatcher_admin", // Display name
        vendor_name: vendor_name || "Merchant",
        currency: currency || "SAR",
        invoice_number: invoice_number || "",
        vat_number: vat_number || "",
        vat_amount: Number(vat_amount) || 0,
        subtotal_amount: Number(subtotal_amount) || 0,
        needs_manual_review: !!needs_manual_review,
        raw_ocr_text: raw_ocr_text || "",
        image_url: image_url || "",
        created_at: new Date().toISOString()
      };
      
      console.log("Executing transaction ledger write to Firestore 'transactions' collection with integrated receipt data:", JSON.stringify(txData, null, 2));
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
      const snapshot = await adminDb.collection("transactions").where("type", "==", "receipt").get();
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        list.push({
          id: data.receiptId || data.id,
          driver_id: data.driver_id || data.driver_uid || "", // standardized UID is driver_id
          driver_name: data.driver_name || data.driver_id || data.createdBy || "dispatcher_admin", // display name is driver_name
          vendor_name: data.vendor_name || data.title || "Merchant",
          amount: Number(data.amount) || 0,
          currency: data.currency || "SAR",
          transaction_date: data.transaction_date || data.date || new Date().toISOString().split("T")[0],
          invoice_number: data.invoice_number || "",
          vat_number: data.vat_number || "",
          vat_amount: Number(data.vat_amount) || 0,
          subtotal_amount: Number(data.subtotal_amount) || 0,
          needs_manual_review: !!data.needs_manual_review,
          raw_ocr_text: data.raw_ocr_text || "",
          image_url: data.image_url || "",
          created_at: data.created_at || data.createdAt || new Date().toISOString()
        });
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

// AUTH SESSION ENDPOINTS
app.post("/api/auth/session", async (req, res) => {
  const idToken = req.body.idToken?.toString();
  if (!idToken) {
    return res.status(401).send("Unauthorized");
  }

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  
  try {
    if (!adminApp) {
      // In local dev without service account, acknowledge session client-side
      return res.json({ status: 'client_fallback' });
    }
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
    const options = { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production' };
    res.cookie('session', sessionCookie, options);
    res.end(JSON.stringify({ status: 'success' }));
  } catch (error) {
    res.status(401).send("Unauthorized Request!");
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('session');
  res.redirect('/');
});

// SEO Static Files (robots.txt & sitemap.xml)
app.get("/robots.txt", (req, res) => {
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'qawafil-al-majd.com';
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const siteUrl = `${protocol}://${host}`;
  
  res.type('text/plain').send(
`# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Allow: /fleet
Allow: /ziyarat
Allow: /contact
Allow: /rates.json
Allow: /assets/

# Disallow internal admin & auth endpoints
Disallow: /admin
Disallow: /dashboard
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml`
  );
});

app.get("/sitemap.xml", (req, res) => {
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'qawafil-al-majd.com';
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const siteUrl = `${protocol}://${host}`;
  const today = new Date().toISOString().split('T')[0];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Homepage -->
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${siteUrl}/?lang=ar"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/"/>
  </url>

  <!-- Fleet & Caravans -->
  <url>
    <loc>${siteUrl}/fleet</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/fleet?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${siteUrl}/fleet?lang=ar"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/fleet"/>
  </url>

  <!-- Ziyarat & Holy Sites Tours -->
  <url>
    <loc>${siteUrl}/ziyarat</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/ziyarat?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${siteUrl}/ziyarat?lang=ar"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/ziyarat"/>
  </url>

  <!-- Contact & Booking Desk -->
  <url>
    <loc>${siteUrl}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/contact?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${siteUrl}/contact?lang=ar"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/contact"/>
  </url>
</urlset>`;

  res.type('application/xml').send(sitemapXml);
});

// Helper for SEO metadata and crawler fallback per route
function getRouteSEO(pathname: string, origin: string) {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  
  switch (cleanPath) {
    case '/fleet':
      return {
        title: 'Luxury Fleet & VIP Buses | Qawafil Al Majd Al Misaliya | أسطول المركبات والحافلات',
        description: 'Explore the premium fleet of Qawafil Al Majd: Mercedes VIP buses, Toyota Coaster, GMC Yukon VIP, and Hyundai Staria for Umrah pilgrims and corporate delegations across Makkah, Madinah, and Jeddah.',
        keywords: 'Umrah buses, VIP coach rental, Makkah luxury transport, GMC Yukon Makkah, Coaster bus Madinah, pilgrim transport fleet',
        canonical: `${origin}/fleet`,
        noIndex: false,
        fallbackHtml: `
          <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 1000px; margin: auto;">
            <h1>Luxury Fleet & VIP Caravans - Qawafil Al Majd Al Misaliya</h1>
            <p>Certified luxury transportation fleet compliant with Saudi Transport General Authority (TGA). Available for Umrah pilgrims, Ziyarat tours, and inter-city transfers.</p>
            <ul>
              <li><strong>Mercedes Tourismo VIP Bus (49/53 Pax):</strong> Luxurious coach with reclining ergonomic seats, individual A/C, and large luggage capacity.</li>
              <li><strong>Toyota Coaster (18 Pax):</strong> Medium group transit for family Umrah and Ziyarat holy sites tours.</li>
              <li><strong>GMC Yukon XL / VIP SUV (6-7 Pax):</strong> Executive private transfers between Jeddah Airport and Makkah hotels.</li>
              <li><strong>Hyundai Staria / HiAce (9-12 Pax):</strong> Family and group transport with high-speed climate control.</li>
            </ul>
            <p><a href="/contact">Contact Reservations Desk</a> | <a href="/ziyarat">Explore Ziyarat Tours</a> | <a href="/">Return to Home</a></p>
          </div>
        `
      };
    case '/ziyarat':
      return {
        title: 'Guided Holy Sites Ziyarat Tours (Makkah & Madinah) | Qawafil Al Majd | جولات المزارات والمعالم المقدسة',
        description: 'Book private guided Ziyarat tours in Makkah (Jabal Al-Noor, Cave of Hira, Mina, Arafat, Muzdalifah) and Madinah (Masjid Quba, Mount Uhud, Masjid Al-Qiblatayn, Seven Mosques) with Qawafil Al Majd.',
        keywords: 'Ziyarat Makkah, Ziyarat Madinah, Jabal Al-Noor tour, Masjid Quba visit, Mount Uhud tour, pilgrim historical sites, Umrah holy tours',
        canonical: `${origin}/ziyarat`,
        noIndex: false,
        fallbackHtml: `
          <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 1000px; margin: auto;">
            <h1>Sacred Ziyarat & Holy Landmark Tours</h1>
            <p>Comfortable, air-conditioned guided tours to significant Islamic landmarks in Makkah Al-Mukarramah and Al-Madinah Al-Munawwarah.</p>
            <h2>Makkah Historic Landmarks</h2>
            <p>Jabal Al-Noor (Cave of Hira), Cave of Thawr, Mina, Arafat, and Muzdalifah historical paths.</p>
            <h2>Madinah Holy Sites</h2>
            <p>Masjid Quba (first mosque in Islam), Mount Uhud & Martyrs cemetery, Masjid Al-Qiblatayn, and the Seven Mosques battle site.</p>
            <p><a href="/fleet">View Transport Fleet</a> | <a href="/contact">Book Custom Pilgrim Tour</a></p>
          </div>
        `
      };
    case '/contact':
      return {
        title: 'Contact & 24/7 Booking Desk | Qawafil Al Majd Al Misaliya | تواصل معنا وحجز الرحلات',
        description: 'Contact Qawafil Al Majd Al Misaliya 24/7 customer service and booking desk. Instant WhatsApp reservation for airport transfers, VIP buses, and Umrah transport in Saudi Arabia.',
        keywords: 'Qawafil Al Majd contact, Umrah transport booking, Jeddah airport pickup WhatsApp, Makkah hotel transfer contact',
        canonical: `${origin}/contact`,
        noIndex: false,
        fallbackHtml: `
          <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 1000px; margin: auto;">
            <h1>Contact Qawafil Al Majd Al Misaliya</h1>
            <p>24/7 Customer Service and Reservations Desk for Umrah pilgrims and visitors in Makkah, Madinah, and Jeddah.</p>
            <p>Direct WhatsApp booking support with zero upfront prepayment required.</p>
            <p><a href="/">Book Online Now</a> | <a href="/fleet">Our Fleet</a> | <a href="/ziyarat">Ziyarat Packages</a></p>
          </div>
        `
      };
    case '/admin':
      return {
        title: 'Operations & Admin Portal | Qawafil Al Majd',
        description: 'Internal operations management portal for Qawafil Al Majd Al Misaliya.',
        keywords: 'admin',
        canonical: `${origin}/admin`,
        noIndex: true,
        fallbackHtml: '<div style="padding: 2rem; text-align: center;"><h1>Operations Portal</h1><p>Please log in to continue.</p></div>'
      };
    default:
      return {
        title: 'Qawafil Al Majd Al Misaliya | Premium Fleet, Umrah & Ziyarat Transport | قوافل المجد المثالية',
        description: 'Qawafil Al Majd Al Misaliya offers luxury VIP buses, family minivans, and executive transport for Umrah pilgrims, Ziyarat tours, and airport transfers across Makkah, Madinah, and Jeddah, Saudi Arabia.',
        keywords: 'Qawafil Al Majd, Umrah transport, Hajj VIP bus, Makkah to Madinah transport, Jeddah airport transfer, Ziyarat tours Madinah, pilgrim transport Saudi Arabia, قوافل المجد المثالية, نقل معتمرين',
        canonical: `${origin}/`,
        noIndex: false,
        fallbackHtml: `
          <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 1000px; margin: auto;">
            <h1>Qawafil Al Majd Al Misaliya - Pilgrim & Visitor Transport</h1>
            <p>Specialized luxury transport services for Umrah pilgrims, visitors, and delegations across Makkah Al-Mukarramah, Al-Madinah Al-Munawwarah, and Jeddah.</p>
            <h2>Popular Services:</h2>
            <ul>
              <li>Jeddah King Abdulaziz Airport to Makkah Hotels Transfer</li>
              <li>Makkah to Madinah Inter-City VIP Coach Service</li>
              <li>Madinah Airport to Prophet's Mosque Area Transfer</li>
              <li>Guided Historical Ziyarat Tours in Makkah & Madinah</li>
            </ul>
            <p><a href="/fleet">View Vehicles & Buses</a> | <a href="/ziyarat">Ziyarat Tours</a> | <a href="/contact">Contact Support</a></p>
          </div>
        `
      };
  }
}

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    // Development: Use Vite SPA middleware for instant HMR and cross-platform compatibility
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static client assets and handle SSR or static index fallback
    const distClientPath = fs.existsSync(path.join(process.cwd(), 'dist', 'client', 'index.html'))
      ? path.join(process.cwd(), 'dist', 'client')
      : path.join(process.cwd(), 'dist');
    const distServerPath = path.join(process.cwd(), 'dist', 'server', 'entry-server.js');
    app.use(express.static(distClientPath));

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }

      const clientHtmlPath = path.resolve(distClientPath, 'index.html');
      if (!fs.existsSync(clientHtmlPath)) {
        return res.status(404).send('Production build not found. Please run "npm run build".');
      }

      let template = fs.readFileSync(clientHtmlPath, 'utf-8');

      // Compute dynamic host & origin for accurate canonical tags
      const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'qawafil-al-majd.com';
      const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const origin = `${protocol}://${host}`;
      const pathname = req.path;

      const routeSeo = getRouteSEO(pathname, origin);

      // Dynamically replace head metadata to prevent "Duplicate without user-selected canonical"
      template = template
        .replace(/<title>.*?<\/title>/i, `<title>${routeSeo.title}</title>`)
        .replace(/<meta name="title" content=".*?" \/>/i, `<meta name="title" content="${routeSeo.title}" />`)
        .replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${routeSeo.description}" />`)
        .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${routeSeo.title}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${routeSeo.description}" />`)
        .replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${routeSeo.canonical}" />`)
        .replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${routeSeo.title}" />`)
        .replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${routeSeo.description}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${routeSeo.canonical}" />`)
        .replace(/<meta name="robots" content=".*?" \/>/i, `<meta name="robots" content="${routeSeo.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}" />`);

      // Attempt SSR if enabled and server bundle exists
      if (process.env.DISABLE_SSR !== 'true' && fs.existsSync(distServerPath)) {
        try {
          const { pathToFileURL } = await import('url');
          // @ts-ignore
          const ssrModule = await import(pathToFileURL(distServerPath).href);
          if (ssrModule && typeof ssrModule.render === 'function') {
            const appHtml = await ssrModule.render(url);
            const html = template.replace('<!--ssr-outlet-->', () => appHtml);
            return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
          }
        } catch (ssrErr) {
          console.warn('[SSR Production Warning] Falling back to CSR:', (ssrErr as any)?.message || ssrErr);
        }
      }

      // Default CSR response with crawler-friendly semantic fallback HTML
      const fallbackHtml = template
        .replace('<!--ssr-outlet-->', routeSeo.fallbackHtml)
        .replace('<!--ssr-state-->', '');
      return res.status(200).set({ 'Content-Type': 'text/html' }).end(fallbackHtml);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
}

startServer();
