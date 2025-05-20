import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  platform: {
    id: number;
    name: string;
    slug: string;
  };
  category: {
    id: number | null;
    name: string;
    slug: string;
  };
  minOrder: number;
  maxOrder: number;
  deliveryTime?: string;
  imageUrl?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ProductState {
  cart: CartItem[];
  wishlist: Product[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemQuantity: (productId: number, quantity: number) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  clearCart: () => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      addToCart: (product, quantity) =>
        set((state) => {
          const existingItem = state.cart.find(
            (item) => item.product.id === product.id
          );
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity }] };
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        })),
      updateCartItemQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        })),
      addToWishlist: (product) =>
        set((state) => ({
          wishlist: [...state.wishlist, product],
        })),
      removeFromWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== productId),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'product-storage',
    }
  )
); 