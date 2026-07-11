// ===========================================================
// Result Verification page logic (Firestore, public read)
// Reads ?token=XXXX from the URL and looks it up in Firestore.
// ===========================================================
import { db } from "./firebase-init.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const RESULTS_COLLECTION = "results";

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  return d.toLocaleDateString("en-GB", opts);
}

function hide(id) {
  document.getElementById(id).classList.add("hidden");
}
function show(id) {
  document.getElementById(id).classList.remove("hidden");
}

function showLookupBox() {
  hide("loadingState");
  show("lookupBox");
  document.getElementById("manualLookupBtn").addEventListener("click", handleManualLookup);
  document.getElementById("manualToken").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleManualLookup();
  });
}

function showNotFound() {
  hide("loadingState");
  show("notFoundBox");
}

function renderRecord(rec) {
  hide("loadingState");
  show("resultShell");

  document.getElementById("rStudentName").textContent = rec.studentName;
  document.getElementById("rStudentName2").textContent = rec.studentName;
  document.getElementById("rIssued").textContent = "Issued on " + formatDate(rec.issuedOn);
  document.getElementById("rFatherName").textContent = rec.fatherName;
  document.getElementById("rRollNo").textContent = rec.rollNo;
  document.getElementById("rRegNo").textContent = rec.registrationNo;
  document.getElementById("rTotalCgpa").textContent = Number(rec.totalCgpa).toFixed(2);
  document.getElementById("rObtCgpa").textContent = Number(rec.obtainedCgpa).toFixed(2);
  document.getElementById("rTotalMarks").textContent = Number(rec.totalMarks).toFixed(2);
  document.getElementById("rObtMarks").textContent = Number(rec.obtainedMarks).toFixed(2);
  document.getElementById("rPercentage").textContent = rec.percentage + "%";
  document.getElementById("rStatus").textContent = rec.status;

  const statusPill = document.getElementById("rStatusPill");
  statusPill.textContent = rec.status;
  statusPill.classList.add(rec.status === "Pass" ? "pass" : "fail");

  document.title = rec.studentName + " — Result | Thal University";

  document.getElementById("printBtn").addEventListener("click", () => window.print());
}

async function lookupByToken(token) {
  const snap = await getDoc(doc(db, RESULTS_COLLECTION, token));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function lookupByRollNo(rollNo) {
  const q = query(collection(db, RESULTS_COLLECTION), where("rollNo", "==", rollNo), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    showLookupBox();
    return;
  }

  try {
    let rec = await lookupByToken(token);
    if (!rec) rec = await lookupByRollNo(token);
    if (rec) {
      renderRecord(rec);
    } else {
      showNotFound();
    }
  } catch (err) {
    console.error(err);
    showNotFound();
  }
}

async function handleManualLookup() {
  const val = document.getElementById("manualToken").value.trim();
  if (!val) return;
  window.location.href = "result.html?token=" + encodeURIComponent(val);
}

init();
