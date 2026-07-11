// ===========================================================
// Admin dashboard logic (Firebase Auth + Firestore)
// ===========================================================
import { auth, db } from "./firebase-init.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const RESULTS_COLLECTION = "results";
let records = []; // in-memory cache of the last fetch, keyed by token (doc id)

// ---- auth guard ----
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  document.getElementById("authChecking").classList.add("hidden");
  document.getElementById("adminShell").classList.remove("hidden");
  loadRecords();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

// ---- helpers ----
function genToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  return d.toLocaleDateString("en-GB", opts);
}

function toDateInputValue(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toISOString().slice(0, 10);
}

function resultUrlFor(token) {
  return window.location.origin + window.location.pathname.replace(/admin\.html$/, "") + "result.html?token=" + token;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---- fetch + render ----
const recordsBody = document.getElementById("recordsBody");
const emptyState = document.getElementById("emptyState");
const recordsTable = document.getElementById("recordsTable");

async function loadRecords() {
  try {
    const q = query(collection(db, RESULTS_COLLECTION), orderBy("issuedOn", "desc"));
    const snap = await getDocs(q);
    records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderTable();
  } catch (err) {
    console.error(err);
    showToast("Couldn't load records — check your Firestore setup/rules.");
  }
}

function renderTable() {
  recordsBody.innerHTML = "";

  if (records.length === 0) {
    recordsTable.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }
  recordsTable.classList.remove("hidden");
  emptyState.classList.add("hidden");

  records.forEach((rec) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(rec.studentName)}</td>
      <td>${escapeHtml(rec.rollNo)}</td>
      <td>${escapeHtml(rec.registrationNo)}</td>
      <td>${rec.percentage}%</td>
      <td><span class="pill-status ${rec.status === "Pass" ? "pass" : "fail"}">${rec.status}</span></td>
      <td>${formatDate(rec.issuedOn)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="View QR" data-action="qr" data-id="${rec.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </button>
          <button class="icon-btn" title="Edit" data-action="edit" data-id="${rec.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="icon-btn danger" title="Delete" data-action="delete" data-id="${rec.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    recordsBody.appendChild(tr);
  });
}

// ---- form modal ----
const formModalOverlay = document.getElementById("formModalOverlay");
const formModalTitle = document.getElementById("formModalTitle");
const recordForm = document.getElementById("recordForm");
const saveBtn = recordForm.querySelector(".btn-submit");

function openFormModal(record) {
  recordForm.reset();
  document.getElementById("totalCgpa").value = "4.00";

  if (record) {
    formModalTitle.textContent = "Edit Student Result";
    document.getElementById("recordId").value = record.id;
    document.getElementById("studentName").value = record.studentName;
    document.getElementById("fatherName").value = record.fatherName;
    document.getElementById("rollNo").value = record.rollNo;
    document.getElementById("registrationNo").value = record.registrationNo;
    document.getElementById("totalCgpa").value = record.totalCgpa;
    document.getElementById("obtainedCgpa").value = record.obtainedCgpa;
    document.getElementById("totalMarks").value = record.totalMarks;
    document.getElementById("obtainedMarks").value = record.obtainedMarks;
    document.getElementById("status").value = record.status;
    document.getElementById("issuedOn").value = toDateInputValue(record.issuedOn);
  } else {
    formModalTitle.textContent = "Add Student Result";
    document.getElementById("recordId").value = "";
    document.getElementById("issuedOn").value = new Date().toISOString().slice(0, 10);
  }
  formModalOverlay.classList.remove("hidden");
}

function closeFormModal() {
  formModalOverlay.classList.add("hidden");
}

document.getElementById("addRecordBtn").addEventListener("click", () => openFormModal(null));
document.getElementById("formModalClose").addEventListener("click", closeFormModal);
document.getElementById("formCancelBtn").addEventListener("click", closeFormModal);
formModalOverlay.addEventListener("click", (e) => {
  if (e.target === formModalOverlay) closeFormModal();
});

recordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  const id = document.getElementById("recordId").value;
  const totalMarks = parseFloat(document.getElementById("totalMarks").value);
  const obtainedMarks = parseFloat(document.getElementById("obtainedMarks").value);
  const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : "0.00";

  const data = {
    studentName: document.getElementById("studentName").value.trim(),
    fatherName: document.getElementById("fatherName").value.trim(),
    rollNo: document.getElementById("rollNo").value.trim(),
    registrationNo: document.getElementById("registrationNo").value.trim(),
    totalCgpa: parseFloat(document.getElementById("totalCgpa").value),
    obtainedCgpa: parseFloat(document.getElementById("obtainedCgpa").value),
    totalMarks,
    obtainedMarks,
    percentage,
    status: document.getElementById("status").value,
    issuedOn: new Date(document.getElementById("issuedOn").value + "T00:00:00").toISOString(),
  };

  try {
    if (id) {
      await updateDoc(doc(db, RESULTS_COLLECTION, id), data);
      showToast("Record updated.");
      closeFormModal();
      await loadRecords();
    } else {
      const token = genToken();
      const newRecord = { ...data, token };
      await setDoc(doc(db, RESULTS_COLLECTION, token), newRecord);
      showToast("Record added.");
      closeFormModal();
      await loadRecords();
      openQrModal({ id: token, ...newRecord });
    }
  } catch (err) {
    console.error(err);
    showToast("Save failed — check your Firestore rules/connection.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Record";
  }
});

// ---- row actions (edit / delete / qr) ----
recordsBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const record = records.find((r) => r.id === id);
  if (!record) return;

  if (action === "edit") {
    openFormModal(record);
  } else if (action === "delete") {
    if (confirm(`Delete the result record for ${record.studentName}? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, RESULTS_COLLECTION, id));
        showToast("Record deleted.");
        await loadRecords();
      } catch (err) {
        console.error(err);
        showToast("Delete failed — check your Firestore rules/connection.");
      }
    }
  } else if (action === "qr") {
    openQrModal(record);
  }
});

// ---- QR modal ----
const qrModalOverlay = document.getElementById("qrModalOverlay");
const qrBox = document.getElementById("qrBox");
let currentQrRecord = null;

function openQrModal(record) {
  currentQrRecord = record;
  const url = resultUrlFor(record.token);

  document.getElementById("qrStudentLabel").textContent = record.studentName + " — " + record.rollNo;
  document.getElementById("qrLinkInput").value = url;

  qrBox.innerHTML = "";
  new QRCode(qrBox, {
    text: url,
    width: 200,
    height: 200,
    colorDark: "#111827",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });

  qrModalOverlay.classList.remove("hidden");
}

document.getElementById("qrModalClose").addEventListener("click", () => qrModalOverlay.classList.add("hidden"));
qrModalOverlay.addEventListener("click", (e) => {
  if (e.target === qrModalOverlay) qrModalOverlay.classList.add("hidden");
});

document.getElementById("copyLinkBtn").addEventListener("click", () => {
  const input = document.getElementById("qrLinkInput");
  input.select();
  navigator.clipboard?.writeText(input.value);
  showToast("Link copied to clipboard.");
});

document.getElementById("openResultBtn").addEventListener("click", () => {
  if (currentQrRecord) window.open(resultUrlFor(currentQrRecord.token), "_blank");
});

document.getElementById("downloadQrBtn").addEventListener("click", () => {
  const img = qrBox.querySelector("img") || qrBox.querySelector("canvas");
  if (!img) return;
  const link = document.createElement("a");
  link.download = (currentQrRecord?.rollNo || "result") + "-qr.png";
  link.href = img.tagName === "CANVAS" ? img.toDataURL("image/png") : img.src;
  link.click();
});

// ---- toast ----
function showToast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
