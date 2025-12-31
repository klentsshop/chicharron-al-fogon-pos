'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext();

const clean = (v) => {
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  // 💾 1. Al iniciar, recuperar del navegador si existe algo
  useEffect(() => {
    const saved = sessionStorage.getItem('talanquera_cart');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) setItems(parsed);
    }
  }, []);

  // 💾 2. Cada vez que cambien los items, guardarlos en el navegador
  useEffect(() => {
    sessionStorage.setItem('talanquera_cart', JSON.stringify(items));
  }, [items]);

  const addProduct = (product) => {
    const precioNum = clean(product.precio);
    setItems(prev => [...prev, {
      ...product,
      lineId: crypto.randomUUID(),
      cantidad: 1,
      precioNum,
      subtotalNum: precioNum,
      comentario: ''
    }]);
  };

 const setCartFromOrden = (platosOrdenados = []) => {
    // 1. Limpiamos rastro viejo para que no se mezclen comentarios
    sessionStorage.removeItem('talanquera_cart');
    
    const reconstruido = platosOrdenados.map(p => ({
        lineId: p._key || crypto.randomUUID(),
        _id: p._id || p.nombrePlato,
        nombre: p.nombrePlato,
        precio: clean(p.precioUnitario),
        cantidad: Number(p.cantidad) || 1,
        precioNum: clean(p.precioUnitario),
        subtotalNum: clean(p.precioUnitario) * (Number(p.cantidad) || 1),
        comentario: p.comentario || "" // ✅ Si viene null de Sanity, lo vuelve texto
    }));

    console.log('✅ [CartContext] MESA CARGADA:', reconstruido);
    
    setItems(reconstruido);
    // Guardamos la versión fresca de Sanity en la memoria del navegador
    sessionStorage.setItem('talanquera_cart', JSON.stringify(reconstruido));
  };
  const actualizarComentario = (lineId, comentario) => {
    setItems(prev => {
      const nuevo = prev.map(it => it.lineId === lineId ? { ...it, comentario } : it);
      sessionStorage.setItem('talanquera_cart', JSON.stringify(nuevo));
      return nuevo;
    });
  };

  const decrease = (lineId) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.lineId === lineId);
      if (idx === -1) return prev;
      const copy = [...prev];
      if (copy[idx].cantidad <= 1) {
        copy.splice(idx, 1);
      } else {
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad - 1 };
      }
      return copy;
    });
  };

  const clear = () => {
    setItems([]);
    sessionStorage.removeItem('talanquera_cart');
    sessionStorage.removeItem('talanquera_mesa'); // Limpia también rastro de mesa
  };

  const total = useMemo(() => {
    return items.reduce((s, it) => s + (clean(it.precioNum) * it.cantidad), 0);
  }, [items]);

  return (
    <CartContext.Provider value={{
      items, addProduct, setCartFromOrden, decrease, clear, total,
      metodoPago, setMetodoPago, actualizarComentario, cleanPrice: clean
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);