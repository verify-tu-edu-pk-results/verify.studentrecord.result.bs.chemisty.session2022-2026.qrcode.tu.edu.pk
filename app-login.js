// ===========================================================
// Admin login logic (Firebase Authentication)
// ===========================================================
import { auth } from "./firebase-init.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const errorBox = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const loginBtnText = document.getElementById("loginBtnText");

// If already signed in, skip straight to the dashboard
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "admin.html";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.add("hidden");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginBtn.disabled = true;
  loginBtnText.textContent = "Signing in…";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "admin.html";
  } catch (err) {
    errorBox.textContent = friendlyError(err.code);
    errorBox.classList.remove("hidden");
    loginBtn.disabled = false;
    loginBtnText.textContent = "Login";
  }
});

function friendlyError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Invalid email or password. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error — check your connection and try again.";
    default:
      return "Sign in failed. If Firebase isn't configured yet, check firebase-config.js.";
  }
}
