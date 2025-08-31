// assets/firebase-app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, getDoc, updateDoc, addDoc, collection, serverTimestamp,
  enableIndexedDbPersistence, getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const firebaseConfig = {
  "apiKey": "AIzaSyA0y92VMKB0catr6pk5xnztiWyi70npNwc",
  "authDomain": "mabiblio-c80e2.firebaseapp.com",
  "projectId": "mabiblio-c80e2",
  "storageBucket": "mabiblio-c80e2.firebasestorage.app",
  "messagingSenderId": "953573950917",
  "appId": "1:953573950917:web:d3086c448a6589f43cb7ac",
  "measurementId": "G-T7YRW4B1V3"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(()=>{});

export async function authRegister(email, pass){ return createUserWithEmailAndPassword(auth, email, pass); }
export async function authLogin(email, pass){ return signInWithEmailAndPassword(auth, email, pass); }
export async function authLogout(){ return signOut(auth); }

onAuthStateChanged(auth, (user) => {
  document.body.classList.toggle("logged-in", !!user);
  const u = document.querySelector("#whoami");
  if (u) u.textContent = user ? (user.email || "Connecté") : "Anonyme";
});

async function ensureDocRecord(docId, title){
  const ref = doc(db, "documents", docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { title: title || docId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  } else {
    await updateDoc(ref, { updatedAt: serverTimestamp() });
  }
}

export async function countUniqueView(docId, title){
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth()+1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const dateKey = `${y}-${m}-${d}`;
  const uid = auth.currentUser?.uid || "anon";
  const uniqueKey = `v:${docId}:${uid}:${dateKey}`;
  if (sessionStorage.getItem(uniqueKey)) return;
  sessionStorage.setItem(uniqueKey, "1");
  await ensureDocRecord(docId, title);
  const eventId = `${uid}_${dateKey}`;
  const ref = doc(db, "documents", docId, "events", eventId);
  await setDoc(ref, { ts: serverTimestamp(), uid, date: dateKey }, { merge: true });
}

export async function getViewCount(docId){
  const ref = collection(db, "documents", docId, "events");
  const snap = await getCountFromServer(ref);
  return snap.data().count || 0;
}

export async function autoCountAndBind(){
  const path = location.pathname.split("/").pop();
  const DOC_ID = (path || "index.html").replace(/\.html$/i, "");
  const el = document.querySelector("#viewCounter");
  await countUniqueView(DOC_ID, document.title || DOC_ID);
  if (el) el.textContent = await getViewCount(DOC_ID);
}

window.authRegister = authRegister;
window.authLogin = authLogin;
window.authLogout = authLogout;
window.countUniqueView = countUniqueView;
window.getViewCount = getViewCount;
window.autoCountAndBind = autoCountAndBind;