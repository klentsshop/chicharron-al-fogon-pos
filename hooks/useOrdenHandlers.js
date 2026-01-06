import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useOrdenHandlers({
    cart,
    total,
    clearCart,
    setCartFromOrden,
    apiGuardar,
    apiEliminar,
    refreshOrdenes,
    ordenesActivas,
    esModoCajero,
    setMostrarCarritoMobile,
    nombreMesero,
    setNombreMesero,
    rep
}) {
    const [ordenActivaId, setOrdenActivaId] = useState(null);
    const [ordenMesa, setOrdenMesa] = useState(null);
    // ✅ Rastreador de productos ya enviados (IDs)
    const [productosYaImpresos, setProductosYaImpresos] = useState([]);
    const router = useRouter();

    // ==============================
    // NUEVA FUNCIÓN: RESET TOTAL (Para la "X")
    // ==============================
    const resetOrdenActual = () => {
        setOrdenActivaId(null);
        setOrdenMesa(null);
        setProductosYaImpresos([]);
        clearCart();
        if (!esModoCajero) setNombreMesero(null);
    };

    // ==============================
    // CARGAR ORDEN EXISTENTE
    // ==============================
    const cargarOrden = async (id) => {
        try {
            const res = await fetch('/api/ordenes/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ordenId: id })
            });

            if (!res.ok) throw new Error('Error al cargar orden');
            const o = await res.json();

            if (o && o.platosOrdenados) {
                setOrdenActivaId(o._id);
                setOrdenMesa(o.mesa);
                setNombreMesero(o.mesero || (esModoCajero ? 'Caja' : null));
                setCartFromOrden(o.platosOrdenados);
                
                // ✅ Capturamos los IDs que ya existen para ignorarlos en el ticket de adición
                const idsExistentes = o.platosOrdenados.map(p => p._key || p.lineId);
                setProductosYaImpresos(idsExistentes);
                
                setMostrarCarritoMobile(true);
                return true;
            }
        } catch (e) {
            console.error('❌ Error carga orden:', e);
        }
        return false;
    };

    // ==============================
    // GUARDAR ORDEN (COCINA) - LÓGICA ANTI-DUPLICADOS
    // ==============================
    const guardarOrden = async () => {
        if (cart.length === 0) return;

        const mesaDefault = esModoCajero ? 'Mostrador' : 'Mesa 1';
        const mesaIngresada = ordenMesa || prompt('Mesa o Cliente:', mesaDefault);
        if (!mesaIngresada) return;
        const mesa = mesaIngresada.trim();

        if (!ordenActivaId) {
            const existe = ordenesActivas.find(
                (o) => o.mesa?.toLowerCase() === mesa.toLowerCase()
            );
            if (existe && confirm(`La [${mesa}] tiene orden activa. ¿Cargarla?`)) {
                await cargarOrden(existe._id);
                return;
            }
        }

        const meseroFinal = nombreMesero || (esModoCajero ? 'Caja' : null);
        if (!meseroFinal) {
            alert('⚠️ Seleccione mesero antes de guardar.');
            return;
        }

        try {
            // Detectamos si es una actualización (adición)
            const esAdicion = ordenActivaId && productosYaImpresos.length > 0;
            const listaIgnorar = productosYaImpresos.join(',');

            const res = await apiGuardar({
                mesa,
                mesero: meseroFinal,
                ordenId: ordenActivaId,
                platosOrdenados: cart.map((i) => ({
                    _key: i.lineId || Math.random().toString(36).substr(2, 9),
                    nombrePlato: i.nombre || i.nombrePlato,
                    cantidad: i.cantidad,
                    precioUnitario: i.precioNum,
                    subtotal: i.precioNum * i.cantidad,
                    comentario: i.comentario || ''
                }))
            });

            const idParaTicket = res?._id || res?.ordenId;

            // 1. Sincronización de UI
            await refreshOrdenes();

            // 2. Apertura de Ticket Inteligente (Enviamos lista de IDs a ignorar)
            if (idParaTicket) {
                const urlTicket = `/ticket/${idParaTicket}?type=cocina&auto=true${esAdicion ? `&ignorar=${listaIgnorar}` : ''}`;
                
                setTimeout(() => {
                    const win = window.open(urlTicket, 'impresion', 'width=100,height=100,left=0,top=0');
                    if (win) window.focus();
                }, 100);
                
                alert(esAdicion 
                    ? `✅ Adición enviada a cocina para la mesa [${mesa}].` 
                    : `✅ Orden inicial de la mesa [${mesa}] enviada a cocina.`
                );
            }

            // 3. Limpieza y cierre
            setOrdenActivaId(null);
            setOrdenMesa(null);
            setProductosYaImpresos([]);
            clearCart();
            if (!esModoCajero) setNombreMesero(null);
            setMostrarCarritoMobile(false);

        } catch (e) {
            console.error(e);
            alert('❌ Error al guardar.');
        }
    };

    // ==============================
    // COBRAR ORDEN (CAJA) - ALERTA GARANTIZADA
    // ==============================
    const cobrarOrden = async (metodoPago) => {
        if (cart.length === 0 || !esModoCajero) return;
        if (!confirm(`💰 ¿Confirmar cobro por $${total.toLocaleString('es-CO')}?`)) return;

        const subtotalVenta = cart.reduce((s, i) => s + (i.precioNum * i.cantidad), 0);
        const valorPropina = total - subtotalVenta;

        try {
            const res = await fetch('/api/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mesa: ordenMesa || 'Mostrador',
                    mesero: nombreMesero || 'Caja',
                    metodoPago,
                    totalPagado: Number(subtotalVenta),
                    propinaRecaudada: Number(valorPropina),
                    ordenId: ordenActivaId || null,
                    platosVendidosV2: cart.map((i) => ({
                        nombrePlato: i.nombre || i.nombrePlato,
                        cantidad: i.cantidad,
                        precioUnitario: i.precioNum,
                        subtotal: i.precioNum * i.cantidad,
                        comentario: i.comentario || ''
                    }))
                })
            });

            if (!res.ok) throw new Error('Error al cobrar');
            const ventaGuardada = await res.json();

            if (ordenActivaId) await apiEliminar(ordenActivaId);

            // 1. Procesar Ticket de Venta
            if (ventaGuardada?._id) {
                const urlTicket = `/ticket/${ventaGuardada._id}?type=cliente&auto=true`;
                setTimeout(() => {
                    const win = window.open(urlTicket, 'impresionVenta', 'width=100,height=100,left=0,top=0');
                    if (win) window.focus();
                }, 100);

                // ✅ ALERTA DE VENTA EXITOSA
                alert('✅ VENTA REALIZADA CON ÉXITO');
            }

            // 2. Limpieza total y refresco
            clearCart();
            setOrdenActivaId(null);
            setOrdenMesa(null);
            setProductosYaImpresos([]);
            await refreshOrdenes();
            
        } catch (e) {
            console.error(e);
            alert('❌ Error en el pago.');
        }
    };

    // ==============================
    // CANCELAR ORDEN (ELIMINAR)
    // ==============================
    const cancelarOrden = async () => {
        if (!ordenActivaId) return;
        if (!esModoCajero) {
            alert('🔒 PIN de Cajero requerido.');
            return;
        }

        if (confirm(`⚠️ ¿ELIMINAR PERMANENTEMENTE la orden de ${ordenMesa}?`)) {
            try {
                await apiEliminar(ordenActivaId);
                alert('🗑️ Orden eliminada correctamente.');
                resetOrdenActual();
                await refreshOrdenes();
                setMostrarCarritoMobile(false);
            } catch (error) {
                console.error(error);
                alert('❌ Error al eliminar.');
            }
        }
    };

    return {
        ordenActivaId,
        ordenMesa,
        cargarOrden,
        guardarOrden,
        cobrarOrden,
        cancelarOrden,
        resetOrdenActual
    };
}