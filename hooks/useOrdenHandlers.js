// app/hooks/useOrdenHandlers.js
import { useState } from 'react';

export function useOrdenHandlers({
    cart, total, clearCart, setCartFromOrden, 
    apiGuardar, apiEliminar, refreshOrdenes,
    ordenesActivas, esModoCajero, setMostrarCarritoMobile,
    nombreMesero, setNombreMesero,
    rep // 👈 Recibimos el hook de reportes para refrescar
}) {
    const [ordenActivaId, setOrdenActivaId] = useState(null);
    const [ordenMesa, setOrdenMesa] = useState(null);

    const cargarOrden = async (id) => {
        try {
            const res = await fetch('/api/ordenes/get', { 
                method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ ordenId: id }) 
            });
            const o = await res.json();
            if (o && o.platosOrdenados) {
                setOrdenActivaId(o._id); setOrdenMesa(o.mesa); 
                setNombreMesero(o.mesero || (esModoCajero ? "Caja" : null)); 
                setCartFromOrden(o.platosOrdenados); setMostrarCarritoMobile(true);
                return true;
            }
        } catch(e) { console.error("Error carga:", e); }
        return false;
    };

    const guardarOrden = async () => {
        if (cart.length === 0) return;
        let mesaDefault = esModoCajero ? "Mostrador" : "Mesa 1";
        let mesa = ordenMesa || prompt("Mesa o Cliente:", mesaDefault);
        if (!mesa) return;
        if (!ordenActivaId) {
            const existe = ordenesActivas.find((o) => o.mesa.toLowerCase() === mesa.toLowerCase());
            if (existe && confirm(`La [${mesa}] tiene orden activa. ¿Cargarla?`)) { 
                cargarOrden(existe._id); return; 
            }
        }
        let meseroFinal = nombreMesero || (esModoCajero ? "Caja" : null);
        if (!meseroFinal) return alert("⚠️ Seleccione mesero antes de guardar.");
        try {
            await apiGuardar({ 
                mesa, mesero: meseroFinal, ordenId: ordenActivaId, 
                platosOrdenados: cart.map(i => ({ 
                    _key: i.lineId, nombrePlato: i.nombre, cantidad: i.cantidad, 
                    precioUnitario: i.precioNum, subtotal: i.precioNum * i.cantidad,
                    comentario: i.comentario || "" 
                })) 
            });
            await refreshOrdenes(); alert(`✅ Orden guardada.`);
            setOrdenActivaId(null); setOrdenMesa(null); clearCart(); 
            if (!esModoCajero) setNombreMesero(null);
            setMostrarCarritoMobile(false);
        } catch (e) { alert("❌ Error al guardar."); }
    };

    const cobrarOrden = async (metodoPago) => {
        if (cart.length === 0 || !esModoCajero) return;
        if (!confirm(`💰 ¿Cobrar $${total.toLocaleString('es-CO')}?`)) return;

        // 🧠 Lógica de desglosado: Total Venta (Sin propina) vs Propina
        // Usamos Math.round o Number para asegurar precisión centesimal
        const subtotalVenta = cart.reduce((s, i) => s + (i.precioNum * i.cantidad), 0);
        const valorPropina = total - subtotalVenta;

        try {
            const res = await fetch('/api/ventas', { 
                method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    mesa: ordenMesa || "Mostrador", mesero: nombreMesero || "Caja", 
                    metodoPago, 
                    totalPagado: Number(subtotalVenta), // 👈 Venta Real (Sin Propina)
                    propinaRecaudada: Number(valorPropina), // 👈 Propina Pura
                    ordenId: ordenActivaId || null, 
                    platosVendidosV2: cart.map(i => ({ 
                        nombrePlato: i.nombre, cantidad: i.cantidad, 
                        precioUnitario: i.precioNum, subtotal: i.precioNum * i.cantidad,
                        comentario: i.comentario || "" 
                    })) 
                }) 
            });
            if (res.ok) {
                if (ordenActivaId) await apiEliminar(ordenActivaId);
                alert(`✅ Venta Exitosa.`);
                clearCart(); setOrdenActivaId(null); setOrdenMesa(null); 
                await refreshOrdenes();
                // 🔥 Refresco automático de reportes (Admin y Caja)
                if (rep?.cargarReporteAdmin) rep.cargarReporteAdmin();
                if (rep?.generarCierreDia) rep.generarCierreDia();
            } else { alert('❌ Error en servidor.'); }
        } catch (e) { alert('❌ Error en el pago.'); }
    };

    const cancelarOrden = async () => {
        if (!ordenActivaId) return;
        if (!esModoCajero) return alert("🔒 PIN de Cajero requerido.");
        if (confirm(`⚠️ ¿Eliminar orden de ${ordenMesa}?`)) {
            try {
                await apiEliminar(ordenActivaId);
                clearCart(); setOrdenActivaId(null); setOrdenMesa(null);
                if (!esModoCajero) setNombreMesero(null);
                await refreshOrdenes(); alert("🗑️ Eliminada.");
            } catch (error) { alert("❌ Error."); }
        }
    };

    return { 
        ordenActivaId, ordenMesa, cargarOrden, guardarOrden, cobrarOrden, cancelarOrden 
    };
}