'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { cleanPrice } from '@/lib/utils'; // ✅ Usamos tu utilidad global

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [propina, setPropina] = useState(0);
  const [montoManual, setMontoManual] = useState(0);

  // 🛡️ FLAG SENIOR: evita loops al hidratar desde orden
  const isHydratingFromOrden = useRef(false);

  // 💾 1. Al iniciar, recuperar del navegador si existe algo
  useEffect(() => {
    const saved = localStorage.getItem('talanquera_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      } catch (err) {
        console.error('❌ Error leyendo localStorage carrito:', err);
      }
    }
  }, []);

  // 💾 2. Persistir cambios SOLO cuando el usuario modifica el carrito
  useEffect(() => {
    if (isHydratingFromOrden.current) return;

    localStorage.setItem('talanquera_cart', JSON.stringify(items));
  }, [items]);

  const addProduct = (product) => {
    const precioNum = cleanPrice(product.precio);

    setItems(prev => {
      const existingIdx = prev.findIndex(it =>
        it._id === product._id && (!it.comentario || it.comentario.trim() === '')
      );

      if (existingIdx !== -1) {
        const copy = [...prev];
        const nuevaCantidad = copy[existingIdx].cantidad + 1;

        copy[existingIdx] = {
          ...copy[existingIdx],
          cantidad: nuevaCantidad,
          subtotalNum: nuevaCantidad * precioNum
        };

        return copy;
      }

      return [
        ...prev,
        {
          ...product,
          lineId: crypto.randomUUID(),
          cantidad: 1,
          precioNum,
          subtotalNum: precioNum,
          comentario: ''
        }
      ];
    });
  };

  // 🔁 Cargar carrito desde una orden activa (SIN loops ni titileo)
  const setCartFromOrden = (platosOrdenados = []) => {
    isHydratingFromOrden.current = true;

    const reconstruido = platosOrdenados.map(p => ({
      lineId: p._key || crypto.randomUUID(),
      _id: p._id || p.nombrePlato,
      nombre: p.nombrePlato,
      precio: cleanPrice(p.precioUnitario),
      cantidad: Number(p.cantidad) || 1,
      precioNum: cleanPrice(p.precioUnitario),
      subtotalNum: cleanPrice(p.precioUnitario) * (Number(p.cantidad) || 1),
      comentario: p.comentario || ""
    }));

    console.log('✅ [CartContext] MESA CARGADA:', reconstruido);
    setItems(reconstruido);

    // 🔐 CLAVE SENIOR: liberar el lock después del render
    setTimeout(() => {
      isHydratingFromOrden.current = false;
    }, 0);
  };

  const actualizarComentario = (lineId, comentario) => {
    setItems(prev =>
      prev.map(it =>
        it.lineId === lineId ? { ...it, comentario } : it
      )
    );
  };

  const decrease = (lineId) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.lineId === lineId);
      if (idx === -1) return prev;

      const copy = [...prev];
      if (copy[idx].cantidad <= 1) {
        copy.splice(idx, 1);
      } else {
        copy[idx] = {
          ...copy[idx],
          cantidad: copy[idx].cantidad - 1
        };
      }

      return copy;
    });
  };

  const clear = () => {
    setItems([]);
    setPropina(0);
    setMontoManual(0);
    localStorage.removeItem('talanquera_cart');
    localStorage.removeItem('talanquera_mesa');
  };

  // 🧮 TOTAL BLINDADO
  const total = useMemo(() => {
    const subtotalProductos = items.reduce(
      (s, it) => s + it.precioNum * it.cantidad,
      0
    );

    if (propina === -1) {
      return subtotalProductos + Number(montoManual);
    }

    return subtotalProductos + subtotalProductos * (propina / 100);
  }, [items, propina, montoManual]);

  return (
    <CartContext.Provider
      value={{
        items,
        addProduct,
        setCartFromOrden,
        decrease,
        clear,
        total,
        metodoPago,
        setMetodoPago,
        propina,
        setPropina,
        montoManual,
        setMontoManual,
        actualizarComentario,
        cleanPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
