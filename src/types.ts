export interface StoreSettings {
  title: string;
  logo: string | null; // base64
  visibleCategories: string[]; // array of category IDs
  whatsappNumber?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[]; // base64
  categoryId: string;
  archived: boolean;
  stock: number;
  inStock: boolean;
  createdAt: number;
}
