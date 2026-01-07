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
    rep // ⛔️ YA NO SE USA AQUÍ (responsabilidad externa)
}) {
    const [ordenActivaId, setOrdenActivaId] = useState(null);
    const [ordenMesa, setOrdenMesa] = useState(null);

    // ✅ Rastreador de productos ya enviados (IDs)
    const [productosYaImpresos, setProductosYaImpresos] = useState([]);

    // 🔒 Candado anti doble acción
    const [estaGuardando, setEstaGuardando] = useState(false);

    const router = useRouter();

    // ==============================
    // RESET TOTAL DE ORDEN
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

                const idsExistentes = o.platosOrdenados.map(
                    p => p._key || p.lineId
                );
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
    // GUARDAR ORDEN (COCINA)
    // ==============================
    const guardarOrden = async () => {
        if (cart.length === 0 || estaGuardando) return;

        const mesaDefault = esModoCajero ? 'Mostrador' : 'Mesa 1';
        const mesaIngresada = ordenMesa || prompt('Mesa o Cliente:', mesaDefault);
        if (!mesaIngresada) return;

        const mesa = mesaIngresada.trim();

        if (!ordenActivaId) {
            const existe = ordenesActivas.find(
                o => o.mesa?.toLowerCase() === mesa.toLowerCase()
            );

            if (existe) {
                if (confirm(`La [${mesa}] ya tiene orden activa. ¿Cargarla?`)) {
                    await cargarOrden(existe._id);
                }
                return;
            }
        }

        const meseroFinal = nombreMesero || (esModoCajero ? 'Caja' : null);
        if (!meseroFinal) {
            alert('⚠️ Seleccione mesero antes de guardar.');
            return;
        }

        try {
            setEstaGuardando(true);

            const esAdicion = ordenActivaId && productosYaImpresos.length > 0;
            const listaIgnorar = productosYaImpresos.join(',');

            const res = await apiGuardar({
                mesa,
                mesero: meseroFinal,
                ordenId: ordenActivaId,
                platosOrdenados: cart.map(i => ({
                    _key: i.lineId || Math.random().toString(36).substr(2, 9),
                    nombrePlato: i.nombre || i.nombrePlato,
                    cantidad: i.cantidad,
                    precioUnitario: i.precioNum,
                    subtotal: i.precioNum * i.cantidad,
                    comentario: i.comentario || ''
                }))
            });

            const idParaTicket = res?._id || res?.ordenId;

            setOrdenActivaId(null);
            setOrdenMesa(null);
            setProductosYaImpresos([]);
            clearCart();
            if (!esModoCajero) setNombreMesero(null);
            setMostrarCarritoMobile(false);

            await refreshOrdenes();

            if (idParaTicket) {
                const urlTicket =
                    `/ticket/${idParaTicket}?type=cocina&auto=true` +
                    (esAdicion ? `&ignorar=${listaIgnorar}` : '');

                setTimeout(() => {
                    const win = window.open(
                        urlTicket,
                        'impresion',
                        'width=100,height=100,left=0,top=0'
                    );
                    if (win) window.focus();
                }, 100);

                alert(
                    esAdicion
                        ? `✅ Adición enviada a cocina para la mesa [${mesa}].`
                        : `✅ Orden inicial de la mesa [${mesa}] enviada a cocina.`
                );
            }

        } catch (e) {
            console.error(e);
            alert('❌ Error al guardar.');
        } finally {
            setEstaGuardando(false);
        }
    };

    // ==============================
    // COBRAR ORDEN (CAJA)
    // ==============================
    const cobrarOrden = async (metodoPago) => {
        if (cart.length === 0 || !esModoCajero || estaGuardando) {
            return { ventaExitosa: false };
        }

        if (!confirm(`💰 ¿Confirmar cobro por $${total.toLocaleString('es-CO')}?`)) {
            return { ventaExitosa: false };
        }

        const subtotalVenta = cart.reduce(
            (s, i) => s + (i.precioNum * i.cantidad),
            0
        );
        const valorPropina = total - subtotalVenta;

        try {
            setEstaGuardando(true);

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
                    platosVendidosV2: cart.map(i => ({
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

            clearCart();
            setOrdenActivaId(null);
            setOrdenMesa(null);
            setProductosYaImpresos([]);
            await refreshOrdenes();

            if (ventaGuardada?._id) {
                const urlTicket =
                    `/ticket/${ventaGuardada._id}?type=cliente&auto=true`;

                setTimeout(() => {
                    const win = window.open(
                        urlTicket,
                        'impresionVenta',
                        'width=100,height=100,left=0,top=0'
                    );
                    if (win) window.focus();
                }, 100);

                alert('✅ VENTA REALIZADA CON ÉXITO');
            }

            // ✅ RESULTADO EXPLÍCITO
            return {
                ventaExitosa: true,
                ventaId: ventaGuardada?._id || null
            };

        } catch (e) {
            console.error(e);
            alert('❌ Error en el pago.');
            return { ventaExitosa: false };
        } finally {
            setEstaGuardando(false);
        }
    };

    // ==============================
    // CANCELAR ORDEN
    // ==============================
    const cancelarOrden = async () => {
        if (!ordenActivaId || estaGuardando) return;

        if (!esModoCajero) {
            alert('🔒 PIN de Cajero requerido.');
            return;
        }

        if (!confirm(`⚠️ ¿ELIMINAR PERMANENTEMENTE la orden de ${ordenMesa}?`)) {
            return;
        }

        try {
            setEstaGuardando(true);
            await apiEliminar(ordenActivaId);
            resetOrdenActual();
            await refreshOrdenes();
            setMostrarCarritoMobile(false);
            alert('🗑️ Orden eliminada correctamente.');
        } catch (error) {
            console.error(error);
            alert('❌ Error al eliminar.');
        } finally {
            setEstaGuardando(false);
        }
    };

    return {
        ordenActivaId,
        ordenMesa,
        cargarOrden,
        guardarOrden,
        cobrarOrden,
        cancelarOrden,
        resetOrdenActual,
        estaGuardando
    };
}
