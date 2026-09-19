import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS', // Default currency, can be changed
  }).format(price);
}

// Calculates discounted price if discountPercentage exists and is > 0
export function getEffectivePrice(product: { price: number; discountPercentage?: number }): number {
  if (product.discountPercentage && product.discountPercentage > 0) {
    const discount = Math.min(100, Math.max(0, product.discountPercentage));
    return Math.round(product.price * (1 - discount / 100));
  }
  return product.price;
}

// Formats display ID for WhatsApp and Catalog (uses sku if present, or short clean ID)
export function getProductDisplayId(product: { id: string; sku?: string }): string {
  if (product.sku && product.sku.trim().length > 0) {
    return product.sku.trim().toUpperCase();
  }
  // If no sku, take the first 6-8 chars of Firestore doc id in uppercase
  return (product.id ? product.id.slice(0, 6).toUpperCase() : 'PROD');
}

// Compresses image to avoid 1MB limit of Firestore
export function compressImage(file: File, maxWidth = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        const width = img.width > maxWidth ? maxWidth : img.width;
        const height = img.width > maxWidth ? img.height * ratio : img.height;
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        
        ctx.drawImage(img, 0, 0, width, height);
        // Using WebP for better compression, 0.8 quality
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
