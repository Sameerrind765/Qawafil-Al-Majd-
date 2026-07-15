import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services with custom database ID
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "ai-studio-31678edc-7af4-4090-a482-344440b2460a");
export const auth = getAuth(app);

// Critical connection test as specified in standard guidelines
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    // Attempting a brief getFromServer check
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connection operational.");
    return true;
  } catch (error) {
    console.warn("Firebase connected offline or initial security checks bypassed.", error);
    return false;
  }
}
