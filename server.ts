import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize firebase-admin safely
if (!getApps().length) {
  try {
    initializeApp({
      projectId: "qawafil-al-majd-al-mithaliya"
    });
    console.log("Firebase Admin SDK successfully initialized.");
  } catch (adminInitError) {
    console.error("Firebase Admin SDK failed to initialize. Ensure active service credentials or mock environment.", adminInitError);
  }
}

// Global reference
const dbAdmin = getFirestore();
const authAdmin = getAuth();

// API ROUTES (Must be registered BEFORE Vite middleware)

// 1. Create/Invite Admin User
app.post("/api/createAdminUser", async (req, res) => {
  try {
    const { email, name, role, superadminUid } = req.body;
    
    if (!email || !name || !role || !superadminUid) {
      return res.status(400).json({ error: "Missing required fields: email, name, role, and superadminUid" });
    }

    // Verify caller is superadmin
    const callerSnap = await dbAdmin.collection("users").doc(superadminUid).get();
    if (!callerSnap.exists || callerSnap.data()?.role !== "superadmin") {
      return res.status(403).json({ error: "Unauthorized: Only users with 'superadmin' role can invite admins" });
    }

    // Create user in standard Firebase Auth list
    const userRecord = await authAdmin.createUser({
      email,
      displayName: name,
    });

    // Generate a secure password setup link using password-reset mechanism
    let resetLink = "";
    try {
      resetLink = await authAdmin.generatePasswordResetLink(email);
    } catch (linkError) {
      console.warn("Failed to generate password reset link automatically:", linkError);
    }

    // Create custom profile in Firestore's "users" collection
    const userProfile = {
      uid: userRecord.uid,
      name,
      email,
      role, // "admin" | "viewer"
      createdAt: new Date().toISOString(),
      createdBy: superadminUid,
      active: true
    };
    
    await dbAdmin.collection("users").doc(userRecord.uid).set(userProfile);

    return res.json({ 
      success: true, 
      uid: userRecord.uid, 
      resetLink,
      message: "Admin account successfully invited!"
    });
  } catch (error: any) {
    console.error("Backend Error in createAdminUser:", error);
    return res.status(500).json({ error: error.message || "Internal system error occurred during registration" });
  }
});

// 2. Deactivate Admin User
app.post("/api/deactivateAdminUser", async (req, res) => {
  try {
    const { uid, superadminUid } = req.body;
    if (!uid || !superadminUid) {
      return res.status(400).json({ error: "Missing required parameters: uid and superadminUid" });
    }

    // Verify caller is superadmin
    const callerSnap = await dbAdmin.collection("users").doc(superadminUid).get();
    if (!callerSnap.exists || callerSnap.data()?.role !== "superadmin") {
      return res.status(403).json({ error: "Unauthorized: Only 'superadmin' accounts can deactivate user logins" });
    }

    // Lock Auth account
    await authAdmin.updateUser(uid, { disabled: true });

    // Mark inactive in Firestore
    await dbAdmin.collection("users").doc(uid).update({ active: false });

    return res.json({ success: true, message: "User account has been locked and deactivated in catalog." });
  } catch (error: any) {
    console.error("Backend Error in deactivateAdminUser:", error);
    return res.status(500).json({ error: error.message || "Deactivation script failed." });
  }
});

// 3. Reactivate Admin User
app.post("/api/reactivateAdminUser", async (req, res) => {
  try {
    const { uid, superadminUid } = req.body;
    if (!uid || !superadminUid) {
      return res.status(400).json({ error: "Missing required parameters: uid and superadminUid" });
    }

    // Verify caller is superadmin
    const callerSnap = await dbAdmin.collection("users").doc(superadminUid).get();
    if (!callerSnap.exists || callerSnap.data()?.role !== "superadmin") {
      return res.status(403).json({ error: "Unauthorized: Only 'superadmin' accounts can reactivate user logins" });
    }

    // Unlock in Auth
    await authAdmin.updateUser(uid, { disabled: false });

    // Mark active in Firestore
    await dbAdmin.collection("users").doc(uid).update({ active: true });

    return res.json({ success: true, message: "User account has been successfully unlocked." });
  } catch (error: any) {
    console.error("Backend Error in reactivateAdminUser:", error);
    return res.status(500).json({ error: error.message || "Reactivation script failed." });
  }
});

// 4. Delete Admin User
app.post("/api/deleteAdminUser", async (req, res) => {
  try {
    const { uid, superadminUid } = req.body;
    if (!uid || !superadminUid) {
      return res.status(400).json({ error: "Missing required parameters: uid and superadminUid" });
    }

    // Verify caller is superadmin
    const callerSnap = await dbAdmin.collection("users").doc(superadminUid).get();
    if (!callerSnap.exists || callerSnap.data()?.role !== "superadmin") {
      return res.status(403).json({ error: "Unauthorized: Only 'superadmin' accounts can delete user logins" });
    }

    // Remove from auth
    try {
      await authAdmin.deleteUser(uid);
    } catch (authError: any) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
    }

    // Delete Firestore profile
    await dbAdmin.collection("users").doc(uid).delete();

    return res.json({ success: true, message: "User profile successfully removed from directory." });
  } catch (error: any) {
    console.error("Backend Error in deleteAdminUser:", error);
    return res.status(500).json({ error: error.message || "Deletion sequence failed." });
  }
});


// SITE HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "live", timestamp: new Date().toISOString() });
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
