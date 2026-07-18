import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  getDoc,
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch,
  serverTimestamp 
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { db, auth } from "./firebase";

// ==========================================
// AUTH SERVICES
// ==========================================

export const registerUser = async (email, password) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return await signOut(auth);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ==========================================
// DEVICE CODE REGISTRY (global — no uid scope)
// A code like "AB3K7" maps to a userId.
// The Android app reads this to discover its owner.
// ==========================================

/** 
 * Links a 5-char device code to the current user's account.
 * Creates entry in global `deviceCodes/{code}` → { userId, active }
 */
export const linkDeviceCode = async (uid, code) => {
  const upper = code.toUpperCase().trim();
  const codeRef = doc(db, "deviceCodes", upper);
  await setDoc(codeRef, {
    userId: uid,
    active: true,
    linkedAt: serverTimestamp()
  });
  // Also register under user's devices list
  const userDeviceRef = doc(db, "users", uid, "devices", upper);
  await setDoc(userDeviceRef, {
    code: upper,
    linkedAt: serverTimestamp(),
    active: true
  }, { merge: true });
};

/** Unlinks / deactivates a device code */
export const unlinkDeviceCode = async (uid, code) => {
  const upper = code.toUpperCase().trim();
  await deleteDoc(doc(db, "deviceCodes", upper));
  await deleteDoc(doc(db, "users", uid, "devices", upper));
};

/** Subscribe to user's linked device codes list */
export const subscribeToUserDevices = (uid, onUpdate, onError) => {
  if (!uid) return () => {};
  const q = collection(db, "users", uid, "devices");
  return onSnapshot(q, (snap) => {
    const devices = [];
    snap.forEach(d => devices.push({ id: d.id, ...d.data() }));
    onUpdate(devices);
  }, onError);
};

// ==========================================
// LINKS — scoped to user
// ==========================================

export const subscribeToLinks = (uid, onUpdate, onError) => {
  if (!uid) return () => {};
  const q = query(collection(db, "users", uid, "links"), orderBy("order", "asc"));
  return onSnapshot(q, (snapshot) => {
    const links = [];
    snapshot.forEach((doc) => {
      links.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(links);
  }, onError);
};

export const addLink = async (uid, link) => {
  return await addDoc(collection(db, "users", uid, "links"), {
    url: link.url || "",
    order: Number(link.order) || 0,
    active: link.active !== undefined ? link.active : true,
    fixed: link.fixed !== undefined ? link.fixed : false,
    intervalSeconds: Number(link.intervalSeconds) || 15,
    credentials: {
      username: link.credentials?.username || "",
      password: link.credentials?.password || ""
    },
    usernameSelector: link.usernameSelector || "",
    passwordSelector: link.passwordSelector || "",
    submitSelector: link.submitSelector || "",
    zoomLevel: Number(link.zoomLevel) || 100,
    scrollY: Number(link.scrollY) || 0
  });
};

export const updateLink = async (uid, id, updates) => {
  const docRef = doc(db, "users", uid, "links", id);
  return await updateDoc(docRef, updates);
};

export const deleteLink = async (uid, id) => {
  return await deleteDoc(doc(db, "users", uid, "links", id));
};

export const reorderLinks = async (uid, linksList) => {
  const batch = writeBatch(db);
  linksList.forEach((link, index) => {
    const docRef = doc(db, "users", uid, "links", link.id);
    batch.update(docRef, { order: index });
  });
  return await batch.commit();
};

// ==========================================
// MACROS — scoped to user
// ==========================================

export const subscribeToMacros = (uid, onUpdate, onError) => {
  if (!uid) return () => {};
  const q = query(collection(db, "users", uid, "macros"));
  return onSnapshot(q, (snapshot) => {
    const macros = [];
    snapshot.forEach((doc) => {
      macros.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(macros);
  }, onError);
};

export const addMacro = async (uid, macro) => {
  return await addDoc(collection(db, "users", uid, "macros"), {
    linkId: macro.linkId || "",
    name: macro.name || "Nova Macro",
    steps: macro.steps || []
  });
};

export const updateMacro = async (uid, id, updates) => {
  return await updateDoc(doc(db, "users", uid, "macros", id), updates);
};

export const deleteMacro = async (uid, id) => {
  return await deleteDoc(doc(db, "users", uid, "macros", id));
};

// ==========================================
// DEVICE STATE — scoped to user + device code
// ==========================================

export const subscribeToDeviceState = (uid, deviceCode, onUpdate, onError) => {
  if (!uid || !deviceCode) return () => {};
  const docRef = doc(db, "users", uid, "devices", deviceCode, "state", "current");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate({ id: docSnap.id, ...docSnap.data() });
    } else {
      onUpdate(null);
    }
  }, onError);
};

export const sendDeviceCommand = async (uid, deviceCode, action, extra = {}) => {
  if (!uid) throw new Error("Usuário não autenticado");
  if (!deviceCode) throw new Error("Código do dispositivo não especificado");
  const docRef = doc(db, "users", uid, "devices", deviceCode, "state", "current");
  const payload = {
    action,
    updatedAt: serverTimestamp(),
    ...extra
  };
  return await setDoc(docRef, payload, { merge: true });
};

/**
 * Broadcast the same command to MULTIPLE device codes at once.
 * Uses a Firestore writeBatch for atomic simultaneous delivery.
 * @param {string} uid - Owner's Firebase UID
 * @param {string[]} deviceCodes - Array of 5-char device codes
 * @param {string} action - Command action string
 * @param {object} extra - Additional payload fields
 */
export const broadcastCommand = async (uid, deviceCodes, action, extra = {}) => {
  if (!uid) throw new Error("Usuário não autenticado");
  if (!deviceCodes || deviceCodes.length === 0) throw new Error("Nenhum dispositivo selecionado");
  const batch = writeBatch(db);
  const payload = {
    action,
    updatedAt: serverTimestamp(),
    ...extra
  };
  deviceCodes.forEach((code) => {
    const docRef = doc(db, "users", uid, "devices", code, "state", "current");
    batch.set(docRef, payload, { merge: true });
  });
  return await batch.commit();
};
