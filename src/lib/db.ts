import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { StoreSettings, Category, Product } from '../types';

// Settings
const SETTINGS_CACHE_KEY = 'joyeria_store_settings';

export const getCachedSettings = (): StoreSettings | null => {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore JSON parse errors
  }
  return null;
};

export const getSettings = async (): Promise<StoreSettings> => {
  const docRef = doc(db, 'settings', 'store');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data() as StoreSettings;
    try {
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
    return data;
  }
  const defaultSettings: StoreSettings = { 
    title: 'Catálogo de Joyería', 
    logo: null, 
    visibleCategories: [], 
    whatsappNumber: '' 
  };
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(defaultSettings));
  } catch {
    // Ignore quota errors
  }
  return defaultSettings;
};

export const updateSettings = async (settings: Partial<StoreSettings>) => {
  const docRef = doc(db, 'settings', 'store');
  // Ensure that if logo is null, it completely removes the old logo in Firestore
  await setDoc(docRef, settings, { merge: true });
  try {
    const cached = getCachedSettings() || { title: '', logo: null, visibleCategories: [] };
    const merged = { ...cached, ...settings };
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: merged }));
  } catch {
    // Ignore
  }
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const q = query(collection(db, 'categories'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const addCategory = async (category: Omit<Category, 'id'>) => {
  const newRef = doc(collection(db, 'categories'));
  await setDoc(newRef, category);
  return newRef.id;
};

export const updateCategory = async (id: string, category: Partial<Category>) => {
  const ref = doc(db, 'categories', id);
  await updateDoc(ref, category);
};

export const deleteCategory = async (id: string) => {
  await deleteDoc(doc(db, 'categories', id));
};

// Products
export const getProducts = async (includeArchived = false): Promise<Product[]> => {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  if (!includeArchived) {
    products = products.filter(p => !p.archived);
  }
  return products;
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  const q = query(collection(db, 'products'), where('categoryId', '==', categoryId), where('archived', '==', false));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = async (product: Omit<Product, 'id'>) => {
  const newRef = doc(collection(db, 'products'));
  await setDoc(newRef, product);
  return newRef.id;
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
  const ref = doc(db, 'products', id);
  await updateDoc(ref, product);
};

export const deleteProduct = async (id: string) => {
  await deleteDoc(doc(db, 'products', id));
};
