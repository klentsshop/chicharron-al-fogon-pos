'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo
} from 'react';

const CartContext = createContext();

/**
 * 🧹 Limpieza robusta de precios
 */
const clean = (v) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v === null || v === undefined) return 0;

  const cleaned = String(v)
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\s/g, '')
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

export function CartProvider({ children, initial = [] }) {
  const [items, setItems] = useState(initial);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  /**
   * 🔍 Setter con debug
   */
  const setItemsDebug = (updater) => {
    setItems(prev => {
      const next = typeof updater === 'function'
        ? updater(prev)
        : updater;

      console.log('[CartContext] ITEMS ACTUALIZADOS:', next);
      try { window.__POS_CART_ITEMS = next; } catch (e) {}
      return next;
    });
  };

  /**
   * ➕ USO NORMAL
   * Click sobre producto (SIEMPRE suma +1)
   */
  const addProduct = (product) => {
    setItemsDebug(prev => {
      const id = product._id;
      const precioNum = clean(product.precio);

      const idx = prev.findIndex(p => p._id === id);

      if (idx >= 0) {
        const copy = [...prev];
        const it = copy[idx];
        const nuevaCant = it.cantidad + 1;

        copy[idx] = {
          ...it,
          cantidad: nuevaCant,
          subtotalNum: Math.round(precioNum * nuevaCant),
        };

        return copy;
      }

      return [
        ...prev,
        {
          ...product,
          _id: id,
          cantidad: 1,
          precioNum,
          subtotalNum: Math.round(precioNum),
        },
      ];
    });
  };

  /**
   * 🔥 FUNCIÓN CLAVE
   * Reconstruye el carrito COMPLETO desde una orden guardada
   * (respeta cantidades y precios reales)
   */
  const setCartFromOrden = (platosOrdenados = []) => {
    const reconstruido = platosOrdenados.map(p => {
      const precioNum = clean(p.precioUnitario);
    const cantidad = Number(p.cantidad) || 1;

    return {
      _id: p.nombrePlato, // 🔑 ID ESTABLE
      nombre: p.nombrePlato,
      precio: precioNum,
      cantidad,
      precioNum,
      subtotalNum: precioNum * cantidad,
    };
  });
  

    console.log(
      '[CartContext] CARRITO RECONSTRUIDO DESDE ORDEN:',
      reconstruido
    );

    setItemsDebug(reconstruido);
  };

  /**
   * ➖ Disminuir cantidad
   */
  const decrease = (id) => {
    setItemsDebug(prev => {
      const idx = prev.findIndex(i => i._id === id);
      if (idx === -1) return prev;

      const copy = [...prev];
      const it = copy[idx];

      if (it.cantidad <= 1) {
        copy.splice(idx, 1);
      } else {
        const nuevaCant = it.cantidad - 1;
        copy[idx] = {
          ...it,
          cantidad: nuevaCant,
          subtotalNum: Math.round(it.precioNum * nuevaCant),
        };
      }

      return copy;
    });
  };

  /**
   * 🧹 Vaciar carrito
   */
  const clear = () => setItemsDebug([]);

  /**
   * 💰 Total del carrito
   */
  const total = useMemo(() => {
    const t = items.reduce(
      (s, it) =>
        s + clean(it.subtotalNum ?? it.precioNum * it.cantidad),
      0
    );

    console.log('[CartContext] TOTAL RECALCULADO:', t);
    try { window.__POS_CART_TOTAL = t; } catch (e) {}
    return t;
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addProduct,
        setCartFromOrden, // 🔥 CLAVE
        decrease,
        clear,
        total,
        metodoPago,
        setMetodoPago,
        cleanPrice: clean,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return ctx;
};
