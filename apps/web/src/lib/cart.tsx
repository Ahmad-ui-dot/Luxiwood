"use client";

import type { ConfiguratorKey, Model3dKey } from "@luxiwood/shared";
import { createContext, useContext, useEffect, useState } from "react";

const CART_KEY = "luxiwood-cart";
export const MAX_CART_ITEMS = 20;
export const MAX_QUANTITY = 99;

// Позиция корзины: то, что уйдёт в POST /orders, плюс подписи для показа.
// Цена — подсказка на момент добавления, итог сервер считает сам
type CartItemBase = {
  key: string;
  quantity: number;
  title: string;
  model3dKey: Model3dKey;
  colorName: string;
  colorHex: string;
  sizeLabel: string;
  preview: { main: string; wood?: string };
  unitPrice: number;
};

// Товар из каталога и ID выбранных вариантов
export type ProductCartItem = CartItemBase & {
  productId: number;
  mainMaterialId: number;
  colorMaterialId?: number;
  woodMaterialId?: number;
  sizeId?: number;
  slug: string;
};

// Мебель из конструктора: тип, размеры, материалы и опции
export type ConfiguratorCartItem = CartItemBase & {
  type: ConfiguratorKey;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  upholsteryMaterialId?: number;
  colorMaterialId?: number;
  woodMaterialId: number;
  finishMaterialId: number;
  options: string[];
};

export type CartItem = ProductCartItem | ConfiguratorCartItem;

type CartContextValue = {
  items: CartItem[];
  count: number;
  ready: boolean;
  add: (item: CartItem) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // Испорченная запись — начинаем с пустой корзины
    }
    setReady(true);
  }, []);

  function save(next: CartItem[]) {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  // Тот же товар с теми же вариантами не дублируется — увеличивается количество
  function add(item: CartItem) {
    const same = items.find((current) => current.key === item.key);
    if (same) {
      setQuantity(item.key, same.quantity + item.quantity);
    } else {
      save([...items, item].slice(0, MAX_CART_ITEMS));
    }
  }

  function setQuantity(key: string, quantity: number) {
    const value = Math.min(Math.max(quantity, 1), MAX_QUANTITY);
    save(items.map((item) => (item.key === key ? { ...item, quantity: value } : item)));
  }

  function remove(key: string) {
    save(items.filter((item) => item.key !== key));
  }

  function clear() {
    save([]);
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return <CartContext.Provider value={{ items, count, ready, add, setQuantity, remove, clear }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart работает только внутри CartProvider");
  }
  return context;
}
