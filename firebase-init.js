// ===========================================================
// Firebase initialization
// Imported by app-login.js / app-admin.js / app-result.js
// ===========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

if (!window.firebaseConfig || window.firebaseConfig.apiKey === "YOUR_API_KEY") {
  console.error(
    "Firebase is not configured yet. Edit firebase-config.js with your project's keys " +
    "(Firebase Console → Project settings → General → Your apps → Web app)."
  );
}

const app = initializeApp(window.firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
