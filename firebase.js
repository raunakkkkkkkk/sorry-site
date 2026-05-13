// Firebase setup:
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. Enable Firestore Database.
// 3. Replace the placeholder values below with your web app config.
// 4. In Firestore Rules, allow writes/reads only as needed for your use case.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const LOCAL_STORAGE_KEY = "apologySelections_v2";
localStorage.removeItem("apologySelections");

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const hasFirebaseConfig = !Object.values(firebaseConfig).some((value) =>
  String(value).startsWith("YOUR_")
);

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

export function isFirebaseReady() {
  return Boolean(db);
}

export async function savePunishmentSelection({ option, customMessage = "" }) {
  const localRecord = saveLocalSelection({
    option,
    customMessage,
    createdAt: new Date().toISOString()
  });

  if (!db) {
    return { ...localRecord, localOnly: true };
  }

  try {
    const docRef = await addDoc(collection(db, "apologyResponses"), {
      option,
      customMessage,
      createdAt: serverTimestamp()
    });

    return { id: docRef.id, option, customMessage };
  } catch (error) {
    console.warn("Firestore save failed. Kept a local backup response.", error);
    return { ...localRecord, localOnly: true, firestoreError: true };
  }
}

export async function getPunishmentSelections() {
  if (!db) {
    return getLocalSelections();
  }

  try {
    const responsesQuery = query(
      collection(db, "apologyResponses"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(responsesQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      source: "Firestore",
      ...doc.data()
    }));
  } catch (error) {
    console.warn("Firestore read failed. Showing local backup responses.", error);
    return getLocalSelections().map((record) => ({
      ...record,
      firestoreError: true
    }));
  }
}

export async function clearPunishmentSelections() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);

  if (!db) {
    return;
  }

  const snapshot = await getDocs(collection(db, "apologyResponses"));
  await Promise.all(snapshot.docs.map((responseDoc) => deleteDoc(responseDoc.ref)));
}

export function getLocalSelections() {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
}

function saveLocalSelection(record) {
  const localSelections = getLocalSelections();
  const savedRecord = {
    id: crypto.randomUUID(),
    source: "Local backup",
    ...record
  };

  localSelections.unshift(savedRecord);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localSelections));
  return savedRecord;
}
