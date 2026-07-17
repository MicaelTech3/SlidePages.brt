import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

// ==========================================
// SERVIÇOS DE LINKS
// ==========================================

// Inscrição em tempo real para os links ordenados
export const subscribeToLinks = (onUpdate, onError) => {
  const q = query(collection(db, "links"), orderBy("order", "asc"));
  return onSnapshot(q, (snapshot) => {
    const links = [];
    snapshot.forEach((doc) => {
      links.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(links);
  }, onError);
};

// Adiciona um novo link
export const addLink = async (link) => {
  return await addDoc(collection(db, "links"), {
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

// Atualiza um link existente
export const updateLink = async (id, updates) => {
  const docRef = doc(db, "links", id);
  return await updateDoc(docRef, updates);
};

// Remove um link
export const deleteLink = async (id) => {
  return await deleteDoc(doc(db, "links", id));
};

// Reordenação de links em lote (batch)
export const reorderLinks = async (linksList) => {
  const batch = writeBatch(db);
  linksList.forEach((link, index) => {
    const docRef = doc(db, "links", link.id);
    batch.update(docRef, { order: index });
  });
  return await batch.commit();
};

// ==========================================
// SERVIÇOS DE MACROS
// ==========================================

// Inscrição em tempo real para as macros
export const subscribeToMacros = (onUpdate, onError) => {
  const q = query(collection(db, "macros"));
  return onSnapshot(q, (snapshot) => {
    const macros = [];
    snapshot.forEach((doc) => {
      macros.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(macros);
  }, onError);
};

// Adiciona uma nova macro
export const addMacro = async (macro) => {
  return await addDoc(collection(db, "macros"), {
    linkId: macro.linkId || "",
    name: macro.name || "Nova Macro",
    steps: macro.steps || []
  });
};

// Atualiza uma macro
export const updateMacro = async (id, updates) => {
  const docRef = doc(db, "macros", id);
  return await updateDoc(docRef, updates);
};

// Deleta uma macro
export const deleteMacro = async (id) => {
  return await deleteDoc(doc(db, "macros", id));
};

// ==========================================
// SERVIÇOS DO DISPOSITIVO (COMANDO E ESTADO)
// ==========================================

// Inscrição em tempo real no estado de um dispositivo específico
export const subscribeToDeviceState = (deviceId, onUpdate, onError) => {
  if (!deviceId) return () => {};
  const docRef = doc(db, "devices", deviceId, "state", "current");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate({ id: docSnap.id, ...docSnap.data() });
    } else {
      onUpdate(null);
    }
  }, onError);
};

// Envia comandos de estado/ação para o dispositivo
export const sendDeviceCommand = async (deviceId, action, extra = {}) => {
  if (!deviceId) throw new Error("ID do dispositivo não especificado");
  const docRef = doc(db, "devices", deviceId, "state", "current");
  
  const payload = {
    action, // "play" | "pause" | "goto" | "reload" | "runMacro" | "fixPage" | "newPath"
    updatedAt: serverTimestamp(),
    ...extra
  };
  
  // Usamos setDoc com merge para criar o documento caso ele não exista
  return await setDoc(docRef, payload, { merge: true });
};
