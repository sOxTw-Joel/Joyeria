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
export const getSettings = async (): Promise<StoreSettings> => {
  const docRef = doc(db, 'settings', 'store');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as StoreSettings;
  }
  return { title: 'Catálogo de Joyería', logo: null, visibleCategories: [], whatsappNumber: '' };
};

export const updateSettings = async (settings: Partial<StoreSettings>) => {
  const docRef = doc(db, 'settings', 'store');
  await setDoc(docRef, settings, { merge: true });
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
