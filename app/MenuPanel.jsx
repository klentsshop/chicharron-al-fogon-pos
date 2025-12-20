'use client';

import React, { useState, useEffect } from 'react';
import { client } from '@/lib/sanity';
import { useCart } from './context/CartContext';
import { useOrdenes } from './hooks/useOrdenes';

// Función de visualización
const formatPrecioDisplay = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor && valor !== 0) return 0;
    const cleaned = String(valor)
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\s/g, '')
        .replace(/\$/g, '')
        .replace(/\./g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
};

const categoriasMap = {
    todos: '🏠 TODO',
    carnes: '🥩 Carnes',
    pescados: '🐟 Pescados',
    bebidas: '🥤 Bebidas',
    sopas: '🍲 Sopas',
    infantil: '👶 Infantil',
    desayunos: '☕ Desayuno',
    diario: '🍛 Diario',
    entradas: '🥟 Entradas',
    nocturno: '🌙 Nocturno',
    porciones: '🍟 Porciones',
    otros: '⚙️ Otros'
};

const METODOS_PAGO = [
    { title: 'Efectivo', value: 'efectivo' },
    { title: 'Nequi/Daviplata', value: 'digital' },
    { title: 'Tarjeta', value: 'tarjeta' }
];

export default function MenuPanel() {
    const {
        items: cart,
        total,
        addProduct: agregarAlCarrito,
        decrease: quitarDelCarrito,
        metodoPago,
        setMetodoPago,
        setCartFromOrden,
        clear: clearCart,
        cleanPrice
    } = useCart();

    const { 
        ordenes: ordenesActivas, 
        guardarOrden: apiGuardar, 
        eliminarOrden: apiEliminar, 
        refresh: refreshOrdenes 
    } = useOrdenes();

    const [platos, setPlatos] = useState([]);
    const [categoriaActiva, setCategoriaActiva] = useState('todos');
    const [cargando, setCargando] = useState(true);

    const [mostrarListaOrdenes, setMostrarListaOrdenes] = useState(false);
    const [ordenActivaId, setOrdenActivaId] = useState(null); 
    const [ordenMesa, setOrdenMesa] = useState(null);
    const [esModoCajero, setEsModoCajero] = useState(false);
    const [nombreMesero, setNombreMesero] = useState(null);
    
    // ESTADOS ADMIN
    const [mostrarAdmin, setMostrarAdmin] = useState(false);
    const [reporteAdmin, setReporteAdmin] = useState({ ventasTotales: 0, porMesero: {}, platos: {}, gastos: 0 });
    const [cargandoAdmin, setCargandoAdmin] = useState(false);
    
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFinFiltro, setFechaFinFiltro] = useState(new Date().toISOString().split('T')[0]);

    // ESTADOS REPORTE CAJERO
    const [mostrarReporte, setMostrarReporte] = useState(false);
    const [datosReporte, setDatosReporte] = useState({ ventas: 0, gastos: 0, productos: {} });
    const [cargandoReporte, setCargandoReporte] = useState(false);

    // NUEVOS ESTADOS PARA MÓVIL
    const [mostrarCategoriasMobile, setMostrarCategoriasMobile] = useState(false);
    const [mostrarCarritoMobile, setMostrarCarritoMobile] = useState(false);

    useEffect(() => {
        const fetchPlatos = async () => {
            try {
                const query = `*[_type == "plato"] | order(nombre asc) { _id, nombre, precio, categoria }`;
                const data = await client.fetch(query);
                setPlatos(data);
                setCargando(false);
            } catch (error) {
                console.error("Error cargando platos:", error);
            }
        };
        fetchPlatos();
    }, []);

    const solicitarAccesoCajero = () => {
        if (!esModoCajero) {
            const pin = prompt("🔐 Ingrese PIN de Seguridad para habilitar COBRO:");
            if (pin === "1234") {
                setEsModoCajero(true);
            } else {
                alert("❌ PIN Incorrecto. Acceso denegado.");
            }
        } else {
            setEsModoCajero(false);
        }
    };

    const guardarOrden = async () => {
        if (cart.length === 0) return;
        let mesa = ordenMesa;
        if (!mesa) {
            mesa = prompt("Mesa o Cliente para guardar orden:", "Mesa 1");
            if (!mesa) return;
            if (!ordenActivaId) {
                const mesaExistente = ordenesActivas.find((o) => o.mesa.toLowerCase() === mesa.toLowerCase());
                if (mesaExistente) {
                    const confirmar = confirm(`La [${mesa}] ya tiene una orden activa. ¿Deseas cargarla?`);
                    if (confirmar) { cargarOrden(mesaExistente._id); return; } else { return; }
                }
            }
        }
        let meseroActual = nombreMesero; 
        if (!meseroActual || meseroActual === "Mesero") {
            meseroActual = prompt("👤 Nombre del Mesero que atiende:", "Diana");
            if (!meseroActual) return;
            setNombreMesero(meseroActual);
        }
        const ordenPayload = {
            mesa,
            mesero: meseroActual, 
            ordenId: ordenActivaId || null,
            platosOrdenados: cart.map(item => ({
                nombrePlato: item.nombre,
                cantidad: item.cantidad,
                precioUnitario: item.precio,
                subtotal: cleanPrice(item.precio) * item.cantidad,
            })),
        };
        try {
            const data = await apiGuardar(ordenPayload);
            alert(`✅ Orden de ${data.mesa} (Mesero: ${meseroActual}) guardada.`);
            clearCart(); setOrdenActivaId(null); setOrdenMesa(null); setNombreMesero(null); setMostrarListaOrdenes(false);
            setMostrarCarritoMobile(false); // Cierra carrito en móvil tras guardar
        } catch (error) { alert(`❌ Error: ${error.message}`); }
    };

   const cargarOrden = async (ordenId) => {
    try {
        const res = await fetch('/api/ordenes/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordenId }),
        });
        
        if (!res.ok) throw new Error('Orden no encontrada');
        const orden = await res.json();
        if (!orden.exists) throw new Error('La orden ya no existe');

        clearCart();
        setCartFromOrden(orden.platosOrdenados.map(p => ({
            nombrePlato: p.nombrePlato,
            precioUnitario: p.precioUnitario,
            cantidad: p.cantidad,
        })));

        setOrdenActivaId(orden._id); 
        setOrdenMesa(orden.mesa); 

        const nombreLimpio = (orden.mesero && orden.mesero.trim() !== "" && orden.mesero !== "Mesero") 
            ? orden.mesero 
            : null;

        setNombreMesero(nombreLimpio || "Mesero"); 
        setMostrarListaOrdenes(false);

    } catch (error) { 
        console.error("Error al cargar orden:", error);
        alert("❌ Esta orden ya no está disponible."); 
        refreshOrdenes(); 
    }
};

    const cobrarOrden = async () => {
    if (!ordenActivaId || cart.length === 0 || !esModoCajero) return;

    const idACobrar = ordenActivaId;
    const mesa = ordenMesa || 'General';
    const meseroReal = (nombreMesero && nombreMesero !== "Mesero") ? nombreMesero : "Personal General";

    if (!confirm(`💰 ¿Confirmar cobro de $${total.toLocaleString('es-CO')}?`)) return;

    try {
        const res = await fetch('/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mesa, 
                mesero: meseroReal,
                metodoPago, 
                totalPagado: total, 
                ordenId: idACobrar,
                platosVendidosV2: cart.map(item => ({
                    nombrePlato: item.nombre, 
                    cantidad: item.cantidad, 
                    precioUnitario: item.precio,
                    subtotal: cleanPrice(item.precio) * item.cantidad
                }))
            }),
        });

        if (!res.ok) throw new Error('Error en el servidor');
        await apiEliminar(idACobrar);
        
        setTimeout(() => {
            clearCart(); 
            setOrdenActivaId(null); 
            setOrdenMesa(null); 
            setNombreMesero(null); 
            setEsModoCajero(false); 
            setMostrarListaOrdenes(false);
            setMostrarCarritoMobile(false);
            alert(`✅ Venta registrada exitosamente por: ${meseroReal}`);
        }, 1000);
        
    } catch (error) { 
        console.error("Error al cobrar:", error);
        alert('❌ Error crítico al procesar el pago.'); 
    }
};

    const cargarReporteAdmin = async () => {
        setCargandoAdmin(true);
        try {
            const inicio = `${fechaInicioFiltro}T00:00:00Z`;
            const fin = `${fechaFinFiltro}T23:59:59Z`;

            const res = await fetch('/api/admin/reportes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fechaInicio: inicio, fechaFin: fin }),
                cache: 'no-store' 
            });
            
            const { ventas, gastos } = await res.json();

            let totalV = 0;
            let meseros = {};
            let platosCont = {};
            let totalG = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

            ventas.forEach(v => {
                totalV += (Number(v.totalPagado) || 0);
                let nombreKey = v.mesero;
                if (!nombreKey || nombreKey.trim() === "" || nombreKey === "Mesero" || nombreKey === "Sin Nombre") {
                    nombreKey = "Personal General";
                }
                meseros[nombreKey] = (meseros[nombreKey] || 0) + (Number(v.totalPagado) || 0);
                v.platosVendidosV2?.forEach(p => {
                    platosCont[p.nombrePlato] = (platosCont[p.nombrePlato] || 0) + p.cantidad;
                });
            });

            setReporteAdmin({ ventasTotales: totalV, porMesero: meseros, platos: platosCont, gastos: totalG });
        } catch (e) {
            console.error("Error Admin Report:", e);
            alert("Error al cargar datos administrativos");
        } finally {
            setCargandoAdmin(false);
        }
    };

    const registrarGasto = async () => {
        const desc = prompt("¿En qué se gastó? (Ej: Gaseosas)");
        if (!desc) return;
        const valor = prompt("¿Cuánto costó?");
        if (!valor || isNaN(valor)) return;

        try {
            const res = await fetch('/api/gastos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcion: desc, monto: valor })
            });

            if (res.ok) {
                alert("✅ Gasto guardado");
                setTimeout(() => {
                    if (mostrarAdmin) cargarReporteAdmin();
                    if (mostrarReporte) generarCierreDia();
                }, 1500);
            }
        } catch (error) {
            alert("❌ Error al guardar gasto");
        }
    };

    const generarCierreDia = async () => {
        setCargandoReporte(true);
        setMostrarReporte(true);
        try {
            const hoy = new Date().toISOString().split('T')[0];
            const queryVentas = `*[_type == "venta" && fecha >= "${hoy}T00:00:00Z"]{ totalPagado, platosVendidosV2 }`;
            const ventasHoy = await client.fetch(queryVentas, {}, { useCdn: false });
            const queryGastos = `*[_type == "gasto" && fecha >= "${hoy}T00:00:00Z"]{ monto }`;
            const gastosHoy = await client.fetch(queryGastos, {}, { useCdn: false });

            let totalVentas = 0;
            let conteoProductos = {};
            
            ventasHoy.forEach(v => {
                totalVentas += (v.totalPagado || 0);
                v.platosVendidosV2?.forEach(p => {
                    conteoProductos[p.nombrePlato] = (conteoProductos[p.nombrePlato] || 0) + p.cantidad;
                });
            });

            const totalGastos = gastosHoy.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
            setDatosReporte({ ventas: totalVentas, gastos: totalGastos, productos: conteoProductos });
        } catch (error) {
            alert("Error al generar reporte");
        } finally {
            setCargandoReporte(false);
        }
    };

    const platosFiltrados = categoriaActiva === 'todos' ? platos : platos.filter(p => p.categoria === categoriaActiva);

    if (cargando) return <div style={{ padding: 50, textAlign: 'center' }}>Cargando menú...</div>;

    return (
        <div className="pos-layout">
            <style jsx>{`
                /* ESCRITORIO - TU DISEÑO ORIGINAL INTACTO */
                @media (min-width: 769px) {
                    .ticket-panel { width: 350px; flex-shrink: 0; border-right: 1px solid #ccc; height: 100vh; overflow-y: auto; }
                    .menu-panel { flex: 1; height: 100vh; overflow-y: auto; display: flex; flex-direction: column; }
                    .products-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; }
                    .mobile-only { display: none !important; }
                }

                /* MÓVIL - INTERFAZ TIPO RAPPI */
                @media (max-width: 768px) {
                    .pos-layout { 
                  flex-direction: column !important; 
                  position: relative; 
                  height: 100vh; 
                  overflow: hidden; 
                  }

                 .menu-panel { 
                 width: 100% !important; 
                 height: 100%; 
                 overflow-y: auto; 
                 padding-bottom: 130px; 
                 -webkit-overflow-scrolling: touch; 
                 }
                    /* Ocultamos el carrito lateral y lo volvemos un modal deslizante */
                    .ticket-panel {
                        position: fixed !important;
                        bottom: -100%;
                        left: 0;
                        width: 100% !important;
                        height: 90vh;
                        background: white;
                        z-index: 4000;
                        transition: bottom 0.3s ease;
                        border-top-left-radius: 20px;
                        border-top-right-radius: 20px;
                        box-shadow: 0 -10px 25px rgba(0,0,0,0.2);
                        display: flex;
                        flex-direction: column;
                    }

                    .ticket-panel.show-mobile { bottom: 0 !important; }
                    /* Arreglo de la cuadrícula de productos para que se vean bien */
                    .products-grid { 
                        grid-template-columns: repeat(2, 1fr) !important; 
                        gap: 12px !important; 
                        padding: 15px !important; 
                    }

                    .product-card {
                        min-height: 120px !important;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        padding: 10px !important;
                    }

                    /* Botón de Categorías mejorado */
                    .categories-bar {
                        position: fixed !important;
                        top: 0;
                        right: -100%;
                        width: 260px !important;
                        height: 100vh;
                        background: white;
                        z-index: 5000;
                        transition: 0.3s;
                        box-shadow: -5px 0 15px rgba(0,0,0,0.2);
                        padding: 20px;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .categories-bar.mobile-show { right: 0 !important; }

                    /* Botón Flotante de Categorías */
                    .mobile-cat-btn {
                        display: block !important;
                        position: fixed;
                        top: 15px;
                        right: 15px;
                        z-index: 3000;
                        background: #374151;
                        color: white;
                        border: none;
                        width: 45px;
                        height: 45px;
                        border-radius: 50%;
                        font-size: 1.2em;
                    }

                    /* EL BOTÓN ESTILO RAPPI */
                    .rappi-cart-btn {
                        display: flex !important;
                        position: fixed;
                        bottom: 20px;
                        left: 5%;
                        width: 90%;
                        background: #10B981;
                        color: white;
                        padding: 18px;
                        border-radius: 15px;
                        justify-content: space-between;
                        align-items: center;
                        font-weight: bold;
                        font-size: 1.1em;
                        box-shadow: 0 5px 20px rgba(16, 185, 129, 0.4);
                        z-index: 3500;
                    }

                    .close-cart-mobile {
                        display: block !important;
                        text-align: center;
                        padding: 10px;
                        color: #6B7280;
                        font-weight: bold;
                    }
                }
                
                .mobile-only { display: none; }
                .rappi-cart-btn { display: none; }
                .close-cart-mobile { display: none; }
            `}</style>

            {/* BOTÓN FLOTANTE DE CATEGORÍAS (MÓVIL) */}
            <button className="mobile-cat-btn" onClick={() => setMostrarCategoriasMobile(!mostrarCategoriasMobile)}>
                {mostrarCategoriasMobile ? '✕' : '☰'}
            </button>

            {/* PANEL DE TICKET (CARRITO) */}
            <div className={`ticket-panel ${mostrarCarritoMobile ? 'show-mobile' : ''}`}>
                <div className="close-cart-mobile" onClick={() => setMostrarCarritoMobile(false)}>
                    ▼ Deslizar para volver al menú
                </div>
                
                <div className="ticket-header">
                    <h2 onClick={solicitarAccesoCajero} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        PEDIDO {ordenMesa ? `(${ordenMesa})` : 'ACTUAL'} 
                        {nombreMesero && ` - 👤 ${nombreMesero}`} {esModoCajero ? '🔓' : '🔒'}
                    </h2>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                            onClick={() => { refreshOrdenes(); setMostrarListaOrdenes(true); }}
                            style={{ padding: '8px 12px', backgroundColor: '#9CA3AF', color: 'white', border: 'none', borderRadius: '5px', fontSize: '0.8em' }}
                        >
                            ÓRDENES ({ordenesActivas.length})
                        </button>
                        <button
                            onClick={generarCierreDia}
                            style={{ padding: '8px 12px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '5px', fontSize: '0.8em' }}
                        >
                            REPORTE
                        </button>
                    </div>
                </div>

                <div className="ticket-body">
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carrito vacío</div>
                    ) : (
                        cart.map(item => (
                            <div key={item._id} className="ticket-item">
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0 }}>{item.nombre}</h4>
                                    <p style={{ margin: 0, fontSize: '0.9em' }}>${formatPrecioDisplay(item.precio).toLocaleString('es-CO')} x {item.cantidad}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <strong>${(cleanPrice(item.precio) * item.cantidad).toLocaleString('es-CO')}</strong>
                                    <button className="btn-remove" onClick={() => quitarDelCarrito(item._id)}>-</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="ticket-footer">
                    <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {METODOS_PAGO.map(m => (
                            <button key={m.value} onClick={() => setMetodoPago(m.value)}
                                style={{
                                    flex: 1, padding: 8, borderRadius: 5, border: 'none', cursor: 'pointer',
                                    backgroundColor: metodoPago === m.value ? '#10B981' : '#F3F4F6',
                                    color: metodoPago === m.value ? 'white' : 'black'
                                }}>
                                {m.title}
                            </button>
                        ))}
                    </div>

                    <div className="total-row" style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1.2em', fontWeight: 700 }}>TOTAL</span>
                        <span style={{ fontSize: '1.5em', fontWeight: 900 }}>
                            ${Number(total || 0).toLocaleString('es-CO')}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                            className="btn-guardar-orden"
                            onClick={guardarOrden}
                            disabled={cart.length === 0}
                            style={{ flex: 1, padding: '15px', borderRadius: '8px', border: 'none', fontWeight: 700, backgroundColor: '#FFC107', color: 'black' }}
                        >
                            {ordenActivaId ? 'ACTUALIZAR' : 'GUARDAR'}
                        </button>

                        {esModoCajero && (
                            <button
                                className="btn-cobrar"
                                onClick={cobrarOrden}
                                style={{ flex: 1, padding: '15px', borderRadius: '8px', border: 'none', fontWeight: 700, backgroundColor: '#10B981', color: 'white' }}
                            >
                                COBRAR
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* PANEL DE MENÚ (PRODUCTOS) */}
            <div className="menu-panel">
                <div className={`categories-bar ${mostrarCategoriasMobile ? 'mobile-show' : ''}`}>
                    <h3 className="mobile-only" style={{ marginBottom: '15px' }}>Categorías</h3>
                    {['todos', ...new Set(platos.map(p => p.categoria))].map(cat => (
                        <button 
                            key={cat} 
                            className={`cat-btn ${categoriaActiva === cat ? 'active' : ''}`} 
                            onClick={() => {
                                setCategoriaActiva(cat);
                                setMostrarCategoriasMobile(false);
                            }}>
                            {categoriasMap[cat] || cat}
                        </button>
                    ))}
                </div>

                <div className="products-grid">
                    {platosFiltrados.map(plato => (
                        <div key={plato._id} className="product-card" onClick={() => agregarAlCarrito(plato)}>
                            <div className="card-title" style={{ fontWeight: 'bold' }}>{plato.nombre}</div>
                            <div className="card-price">${formatPrecioDisplay(plato.precio).toLocaleString('es-CO')}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BOTÓN ESTILO RAPPI (SOLO MÓVIL) */}
            {cart.length > 0 && !mostrarCarritoMobile && (
                <button className="rappi-cart-btn" onClick={() => setMostrarCarritoMobile(true)}>
                    <span>🛒 Ver Pedido ({cart.reduce((acc, item) => acc + item.cantidad, 0)})</span>
                    <span>${total.toLocaleString('es-CO')}</span>
                </button>
            )}

            {/* --- LOS MODALES SIGUEN SIENDO LOS MISMOS (ADMIN, REPORTE, ÓRDENES) --- */}
            {mostrarListaOrdenes && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 6000 }}>
                    <div style={{ background: 'white', padding: 20, borderRadius: 10, width: '90%', maxWidth: 400 }}>
                        <h3 style={{ marginBottom: 15 }}>Órdenes Activas ({ordenesActivas.length})
                            <button onClick={() => setMostrarListaOrdenes(false)} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.2em' }}>✕</button>
                        </h3>
                        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {ordenesActivas.map(orden => (
                                <div key={orden._id} style={{ border: '1px solid #ccc', padding: 10, margin: '5px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '5px' }}>
                                    <div>
                                        <strong>{orden.mesa}</strong>
                                        <p style={{ fontSize: '0.8em', color: '#6B7280', margin: 0 }}>👤 {orden.mesero}</p>
                                    </div>
                                    <button onClick={() => cargarOrden(orden._id)} style={{ padding: '8px 12px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '5px' }}>Cargar</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {mostrarReporte && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 7000 }}>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '15px', width: '95%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h2 style={{ margin: 0 }}>📊 Cierre de Caja</h2>
                            <button onClick={() => setMostrarReporte(false)} style={{ fontSize: '1.5em', border: 'none', background: 'none' }}>×</button>
                        </div>
                        {cargandoReporte ? <p style={{ textAlign: 'center' }}>Calculando...</p> : (
                            <>
                                <div style={{ backgroundColor: '#F3F4F6', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
                                    {Object.entries(datosReporte.productos).map(([nombre, cant]) => (
                                        <div key={nombre} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', padding: '5px 0' }}>
                                            <span>{nombre}</span><strong>x{cant}</strong>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}><span>Ventas:</span><strong>${datosReporte.ventas.toLocaleString('es-CO')}</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}><span>Gastos:</span><strong>- ${datosReporte.gastos.toLocaleString('es-CO')}</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3em', fontWeight: '900', backgroundColor: '#FEF3C7', padding: '10px', marginTop: '10px' }}>
                                    <span>UTILIDAD:</span><span>${(datosReporte.ventas - datosReporte.gastos).toLocaleString('es-CO')}</span>
                                </div>
                                <button onClick={() => window.print()} style={{ width: '100%', marginTop: '20px', padding: '12px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px' }}>🖨️ IMPRIMIR</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {mostrarAdmin && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 8000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '95%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>💼 Panel Administrativo</h2>
                            <button onClick={() => setMostrarAdmin(false)} style={{ fontSize: '1.5em', border: 'none', background: 'none' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', backgroundColor: '#F9FAFB', padding: '15px', borderRadius: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label>DESDE:</label>
                                    <input type="date" value={fechaInicioFiltro} onChange={(e) => setFechaInicioFiltro(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>HASTA:</label>
                                    <input type="date" value={fechaFinFiltro} onChange={(e) => setFechaFinFiltro(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                                </div>
                            </div>
                            <button onClick={cargarReporteAdmin} style={{ width: '100%', padding: '10px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>🔍 GENERAR REPORTE</button>
                        </div>
                        {cargandoAdmin ? <p style={{textAlign:'center'}}>Cargando...</p> : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ padding: '15px', background: '#ECFDF5', borderRadius: '10px' }}>
                                        <small>Ventas</small><br/><strong>${reporteAdmin.ventasTotales.toLocaleString('es-CO')}</strong>
                                    </div>
                                    <div style={{ padding: '15px', background: '#FEF2F2', borderRadius: '10px' }}>
                                        <small>Gastos</small><br/><strong>${reporteAdmin.gastos.toLocaleString('es-CO')}</strong>
                                    </div>
                                </div>
                                <h3 style={{ marginTop: '20px' }}>Ventas por Mesero</h3>
                                {Object.entries(reporteAdmin.porMesero).map(([nombre, val]) => (
                                    <div key={nombre} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                        <span>{nombre}</span><strong>${val.toLocaleString('es-CO')}</strong>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}