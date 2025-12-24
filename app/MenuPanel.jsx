'use client';

import React, { useState, useEffect } from 'react';
import { client } from '@/lib/sanity';
import { useCart } from './context/CartContext';
import { useOrdenes } from './hooks/useOrdenes';

import { formatPrecioDisplay, categoriasMap, METODOS_PAGO } from '@/lib/utils';
import ReporteModal from '@/components/modals/ReporteModal';
import AdminModal from '@/components/modals/AdminModal';
import ListaOrdenesModal from '@/components/modals/ListaOrdenesModal';
import TicketPanel from '@/components/pos/TicketPanel';
import ProductGrid from '@/components/pos/ProductGrid';
import styles from './MenuPanel.module.css';

export default function MenuPanel() {
    const { 
        items: cart, total, addProduct: agregarAlCarrito, decrease: quitarDelCarrito, 
        metodoPago, setMetodoPago, setCartFromOrden, clear: clearCart, cleanPrice 
    } = useCart();

    const { 
        ordenes: ordenesActivas, guardarOrden: apiGuardar, 
        eliminarOrden: apiEliminar, refresh: refreshOrdenes 
    } = useOrdenes();

    const [platos, setPlatos] = useState([]);
    const [categoriaActiva, setCategoriaActiva] = useState('todos');
    const [cargando, setCargando] = useState(true);
    const [mostrarListaOrdenes, setMostrarListaOrdenes] = useState(false);
    const [ordenActivaId, setOrdenActivaId] = useState(null); 
    const [ordenMesa, setOrdenMesa] = useState(null);
    const [esModoCajero, setEsModoCajero] = useState(false);
    const [nombreMesero, setNombreMesero] = useState(null);

    const getFechaBogota = () => new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' 
    }).format(new Date());

    const [mostrarAdmin, setMostrarAdmin] = useState(false);
    const [reporteAdmin, setReporteAdmin] = useState({ ventasTotales: 0, porMesero: {}, platos: {}, gastos: 0 });
    const [cargandoAdmin, setCargandoAdmin] = useState(false);
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState(getFechaBogota());
    const [fechaFinFiltro, setFechaFinFiltro] = useState(getFechaBogota());

    const [mostrarReporte, setMostrarReporte] = useState(false);
    const [datosReporte, setDatosReporte] = useState({ ventas: 0, gastos: 0, productos: {} });
    const [cargandoReporte, setCargandoReporte] = useState(false);
    const [fechaInicioReporte, setFechaInicioReporte] = useState(getFechaBogota());
    const [fechaFinReporte, setFechaFinReporte] = useState(getFechaBogota());
    const [listaGastosDetallada, setListaGastosDetallada] = useState([]);

    const [mostrarCategoriasMobile, setMostrarCategoriasMobile] = useState(false);
    const [mostrarCarritoMobile, setMostrarCarritoMobile] = useState(false);
    const [listaMeseros, setListaMeseros] = useState([]);

    useEffect(() => {
        const fetchPlatos = async () => {
            try {
                const data = await client.fetch(`*[_type == "plato"] | order(nombre asc) { _id, nombre, precio, categoria, imagen }`);
                setPlatos(data);
                setCargando(false);
            } catch (error) { console.error("Error cargando platos:", error); }
        };

        const fetchMeseros = async () => {
            try {
                const data = await client.fetch(`*[_type == "mesero"] | order(nombre asc)`);
                setListaMeseros(data);
            } catch (error) { console.error("Error cargando meseros:", error); }
        };

        fetchPlatos();
        fetchMeseros();
    }, []);

    const solicitarAccesoCajero = () => {
        const pin = prompt("🔐 Ingrese PIN de Seguridad para habilitar COBRO:");
        if (pin === "1234") { setEsModoCajero(!esModoCajero); } 
        else { alert("❌ PIN Incorrecto."); }
    };

    const solicitarAccesoAdmin = () => {
        const pin = prompt("🔑 Ingrese PIN de Administrador:");
        if (pin === "0111") { setMostrarAdmin(true); cargarReporteAdmin(); } 
        else { alert("❌ PIN Administrativo incorrecto."); }
    };

    const registrarGasto = async () => {
        const desc = prompt("¿En qué se gastó? (Ej: Gaseosas)");
        const valor = prompt("¿Cuánto costó?");
        if (!desc || !valor || isNaN(valor)) return;
        try {
            const res = await fetch('/api/gastos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcion: desc, monto: valor })
            });
            if (res.ok) alert("✅ Gasto guardado con éxito.");
        } catch (error) { alert("❌ Error al guardar gasto."); }
    };

    const guardarOrden = async () => {
        if (cart.length === 0) return;
        let mesa = ordenMesa || prompt("Mesa o Cliente para guardar orden:", "Mesa 1");

        if (!ordenActivaId && mesa) {
            const mesaExistente = ordenesActivas.find((o) => o.mesa.toLowerCase() === mesa.toLowerCase());
            if (mesaExistente) {
                const confirmar = confirm(`La [${mesa}] ya tiene una orden activa. ¿Deseas cargarla?`);
                if (confirmar) { cargarOrden(mesaExistente._id); return; } else { return; }
            }
        }

        if (!nombreMesero) {
            alert("⚠️ Por favor, selecciona un mesero en la lista antes de guardar la orden.");
            return; 
        }

        if (!mesa) return;

        try {
            await apiGuardar({ 
                mesa, 
                mesero: nombreMesero, 
                ordenId: ordenActivaId, 
                platosOrdenados: cart.map(i => ({ 
                    nombrePlato: i.nombre, 
                    cantidad: i.cantidad, 
                    precioUnitario: i.precio, 
                    subtotal: cleanPrice(i.precio) * i.cantidad,
                    comentario: i.comentario || ""
                })) 
            });

            await refreshOrdenes();
            alert(`✅ Orden de ${mesa} guardada.`);
            clearCart(); 
            setOrdenActivaId(null); 
            setOrdenMesa(null); 
            setNombreMesero(null);
            setMostrarCarritoMobile(false);
        } catch (e) { alert("❌ Error al guardar orden."); }
    };

    const actualizarComentario = (id, nuevoComentario) => {
    // Usamos el ID de Sanity para encontrar el plato exacto y actualizar su nota
    setCart(prevCart => 
        prevCart.map(item => 
            item._id === id ? { ...item, comentario: nuevoComentario } : item
        )
    );
};

    const cobrarOrden = async () => {
        if (!ordenActivaId || !esModoCajero) return;
        if (!confirm(`💰 ¿Confirmar cobro de $${total.toLocaleString('es-CO')}?`)) return;
        try {
            await fetch('/api/ventas', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    mesa: ordenMesa, mesero: nombreMesero, metodoPago, 
                    totalPagado: total, ordenId: ordenActivaId, 
                    platosVendidosV2: cart.map(i => ({ 
                        nombrePlato: i.nombre, cantidad: i.cantidad, 
                        precioUnitario: i.precio, subtotal: cleanPrice(i.precio) * i.cantidad,
                        comentario: i.comentario || "" 
                    })) 
                }) 
            });
            await apiEliminar(ordenActivaId);
            alert(`✅ Venta Exitosa.`);
            clearCart(); setOrdenActivaId(null); setOrdenMesa(null); 
            setNombreMesero(null); setEsModoCajero(false); setMostrarCarritoMobile(false);
            await refreshOrdenes();
        } catch (e) { alert('❌ Error crítico en el proceso de pago.'); }
    };

    const generarCierreDia = async () => {
        setCargandoReporte(true);
        setMostrarReporte(true);
        try {
            const startUTC = `${fechaInicioReporte}T05:00:00Z`;
            const endUTC = `${fechaFinReporte}T23:59:59Z`;
            const [ventas, gastos] = await Promise.all([
                client.fetch(`*[_type == "venta" && fecha >= "${startUTC}" && fecha <= "${endUTC}"]`, {}, { useCdn: false }),
                client.fetch(`*[_type == "gasto" && fecha >= "${startUTC}" && fecha <= "${endUTC}"]`, {}, { useCdn: false })
            ]);
            let totalV = 0, prod = {};
            ventas.forEach(v => { 
                totalV += (v.totalPagado || 0); 
                v.platosVendidosV2?.forEach(p => prod[p.nombrePlato] = (prod[p.nombrePlato] || 0) + p.cantidad); 
            });
            setDatosReporte({ ventas: totalV, gastos: gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0), productos: prod });
            setListaGastosDetallada(gastos);
        } catch (e) { alert("❌ Error al generar reporte."); } 
        finally { setCargandoReporte(false); }
    };

    const cargarReporteAdmin = async () => {
        setCargandoAdmin(true);
        try {
            const res = await fetch('/api/admin/reportes', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ fechaInicio: `${fechaInicioFiltro}T05:00:00Z`, fechaFin: `${fechaFinFiltro}T23:59:59Z` }) 
            });
            const { ventas, gastos } = await res.json();
            let totalV = 0, meseros = {};
            ventas.forEach(v => { 
                totalV += (v.totalPagado || 0); 
                let n = v.mesero || "General"; 
                meseros[n] = (meseros[n] || 0) + (v.totalPagado || 0); 
            });
            setReporteAdmin({ ventasTotales: totalV, porMesero: meseros, gastos: gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0) });
        } catch (e) { alert("❌ Error al cargar datos administrativos."); } 
        finally { setCargandoAdmin(false); }
    };

    const cargarOrden = async (id) => {
        try {
            const res = await fetch('/api/ordenes/get', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ ordenId: id }) 
            });
            const o = await res.json();
            clearCart();
            setCartFromOrden(o.platosOrdenados.map(p => ({ 
                nombrePlato: p.nombrePlato, 
                precioUnitario: p.precioUnitario, 
                cantidad: p.cantidad,
                comentario: p.comentario || "" 
            })));
            setOrdenActivaId(o._id); setOrdenMesa(o.mesa); setNombreMesero(o.mesero); setMostrarListaOrdenes(false);
        } catch(e) { alert("❌ Esta orden ya no está disponible."); }
    };

    const cancelarOrden = async () => {
        if (!ordenActivaId) return;
        if (!esModoCajero) { alert("🔒 Solo el cajero con PIN puede eliminar órdenes activas."); return; }
        const confirmar = confirm(`⚠️ ¿ESTÁS SEGURO? \nVas a eliminar permanentemente la orden de ${ordenMesa}.`);
        if (confirmar) {
            try {
                await apiEliminar(ordenActivaId);
                clearCart(); setOrdenActivaId(null); setOrdenMesa(null); setNombreMesero(null);
                await refreshOrdenes();
                alert("🗑️ Orden eliminada correctamente.");
            } catch (error) { alert("❌ Error al intentar eliminar."); }
        }
    };

    const imprimirTicketMesa = () => {
        if (cart.length === 0) return;
        document.body.classList.add('imprimiendo-cliente');
        document.body.classList.remove('imprimiendo-cocina');
        window.print();
    };

    const imprimirComandaCocina = () => {
        if (cart.length === 0) return;
        document.body.classList.add('imprimiendo-cocina');
        document.body.classList.remove('imprimiendo-cliente');
        setTimeout(() => { window.print(); }, 100);
    };

    return (
        <div className={styles.mainWrapper}>
            <div className={styles.posLayout}>
                {/* 1. CSS IMPRESIÓN INTELIGENTE */}
                <style dangerouslySetInnerHTML={{ __html: `
                    #ticket-print, #comanda-print { position: fixed; top: -5000px; left: -5000px; width: 80mm; }
                    @media print {
                        @page { size: 80mm auto !important; margin: 0 !important; }
                        body * { visibility: hidden !important; }
                        
                        body.imprimiendo-cliente #ticket-print, 
                        body.imprimiendo-cliente #ticket-print * { visibility: visible !important; }
                        
                        body.imprimiendo-cocina #comanda-print, 
                        body.imprimiendo-cocina #comanda-print * { visibility: visible !important; }

                        #ticket-print, #comanda-print { 
                            position: absolute !important; left: 0 !important; top: 0 !important; 
                            width: 74mm !important; padding: 2mm !important; margin: 0 !important;
                            background: white !important; font-family: 'Courier New', monospace !important;
                            font-size: 13px !important; color: black !important; line-height: 1.2 !important;
                        }
                        body.imprimiendo-cocina #comanda-print { font-size: 16px !important; }
                    }
                `}} />

                <TicketPanel 
                    cart={cart} total={total} metodoPago={metodoPago} setMetodoPago={setMetodoPago}
                    quitarDelCarrito={quitarDelCarrito} guardarOrden={guardarOrden} cobrarOrden={cobrarOrden}
                    generarCierreDia={generarCierreDia} solicitarAccesoCajero={solicitarAccesoCajero}
                    solicitarAccesoAdmin={solicitarAccesoAdmin} registrarGasto={registrarGasto}
                    refreshOrdenes={refreshOrdenes} setMostrarListaOrdenes={setMostrarListaOrdenes}
                    mostrarCarritoMobile={mostrarCarritoMobile} setMostrarCarritoMobile={setMostrarCarritoMobile}
                    ordenMesa={ordenMesa} nombreMesero={nombreMesero} setNombreMesero={setNombreMesero}
                    listaMeseros={listaMeseros} esModoCajero={esModoCajero}
                    ordenActivaId={ordenActivaId} numOrdenesActivas={ordenesActivas.length} 
                    cleanPrice={cleanPrice} styles={styles} cancelarOrden={cancelarOrden} 
                    imprimirTicket={imprimirTicketMesa} actualizarComentario={actualizarComentario}
                    imprimirComandaCocina={imprimirComandaCocina}
                />

                <ProductGrid 
                    platos={platos} 
                    platosFiltrados={categoriaActiva === 'todos' ? platos : platos.filter(p => p.categoria === categoriaActiva)}
                    categoriaActiva={categoriaActiva} setCategoriaActiva={setCategoriaActiva}
                    mostrarCategoriasMobile={mostrarCategoriasMobile} setMostrarCategoriasMobile={setMostrarCategoriasMobile}
                    agregarAlCarrito={agregarAlCarrito} styles={styles}
                    mostrarCarritoMobile={mostrarCarritoMobile} setMostrarCarritoMobile={setMostrarCarritoMobile}
                />

                {cart.length > 0 && !mostrarCarritoMobile && (
                    <button className={styles.rappiCartBtn} onClick={() => setMostrarCarritoMobile(true)}>
                        <span>🛒 Ver Pedido ({cart.reduce((acc, item) => acc + item.cantidad, 0)})</span>
                        <span>${total.toLocaleString('es-CO')}</span>
                    </button>
                )}

                {/* TICKET CLIENTE */}
                <div id="ticket-print">
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', fontWeight: 'bold' }}>ASADERO LA TALANQUERA</h2>
                        <p style={{ margin: 0 }}>Cra. 6 #26A - 27, Fusagasugá</p>
                        <div style={{ margin: '10px 0', borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '6px 0' }}>
                            <strong>{ordenActivaId ? '--- PRE-CUENTA ---' : '--- COMPROBANTE ---'}</strong>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid black' }}>
                                    <th style={{ textAlign: 'left', width: '12mm' }}>Cant</th>
                                    <th style={{ textAlign: 'left', width: '38mm' }}>Producto</th>
                                    <th style={{ textAlign: 'right', width: '24mm' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ textAlign: 'left' }}>{item.cantidad}</td>
                                        <td style={{ textAlign: 'left' }}>{item.nombre}</td>
                                        <td style={{ textAlign: 'right' }}>${(cleanPrice(item.precio) * item.cantidad).toLocaleString('es-CO')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '10px', borderTop: '2px solid black', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                            <span>TOTAL:</span><span>${total.toLocaleString('es-CO')}</span>
                        </div>
                    </div>
                </div>

                {/* COMANDA COCINA */}
                <div id="comanda-print">
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <h2 style={{ fontSize: '1.8rem', margin: '0' }}>MESA: {ordenMesa || 'MOSTRADOR'}</h2>
                        <p style={{ fontSize: '1.1rem' }}>Atiende: {nombreMesero || 'General'}</p>
                        <hr style={{ border: '1px dashed black' }} />
                        <table style={{ width: '100%', fontSize: '1.3rem', textAlign: 'left' }}>
                            <tbody>
                                {cart.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ fontWeight: 'bold', width: '35px', verticalAlign: 'top' }}>{item.cantidad}x</td>
                                        <td>
                                            <span style={{ fontWeight: 'bold' }}>{item.nombre}</span>
                                            {item.comentario && (
                                                <div style={{ fontSize: '1rem', fontStyle: 'italic', backgroundColor: '#f3f4f6', padding: '4px', marginTop: '2px' }}>
                                                    ** {item.comentario}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ borderTop: '1px solid black', marginTop: '10px', paddingTop: '5px', fontSize: '0.8rem' }}>
                            {new Date().toLocaleString('es-CO')}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.tablesFooter}>
                <div style={{ fontWeight: '900', color: 'white', marginRight: '15px', fontSize: '0.75rem' }}>
                    MESAS ACTIVAS:
                </div>
                {ordenesActivas.length === 0 ? (
                    <span style={{ color: '#d1fae5', fontSize: '0.9rem' }}>No hay mesas pendientes</span>
                ) : (
                    ordenesActivas.map((orden) => (
                        <button 
                            key={orden._id}
                            className={`${styles.tableBtn} ${ordenActivaId === orden._id ? styles.tableBtnActive : ''}`}
                            onClick={() => cargarOrden(orden._id)}
                        >
                            {orden.mesa}
                        </button>
                    ))
                )}
            </div>

            <ListaOrdenesModal isOpen={mostrarListaOrdenes} onClose={() => setMostrarListaOrdenes(false)} ordenes={ordenesActivas} onCargar={cargarOrden} />
            <ReporteModal 
                isOpen={mostrarReporte} onClose={() => setMostrarReporte(false)} 
                cargando={cargandoReporte} datos={datosReporte}
                fechaInicio={fechaInicioReporte} setFechaInicio={setFechaInicioReporte}
                fechaFin={fechaFinReporte} setFechaFin={setFechaFinReporte}
                onGenerar={generarCierreDia} listaGastos={listaGastosDetallada}
            />
            <AdminModal isOpen={mostrarAdmin} onClose={() => setMostrarAdmin(false)} fechaInicio={fechaInicioFiltro} setFechaInicio={setFechaInicioFiltro} fechaFin={fechaFinFiltro} setFechaFin={setFechaFinFiltro} onGenerar={cargarReporteAdmin} cargando={cargandoAdmin} reporte={reporteAdmin} />
        </div>
    );
}