'use client';

import React, { useState, useEffect } from 'react';
// 🛡️ ADAPTADOR: Gestiona si cargamos datos de Sanity o de DEMO_DATA
import { getProductos, getMeseros } from '@/lib/dataAdapter';
import { ENV, DEMO_DATA } from '@/lib/env';

import { useCart } from '@/app/context/CartContext'; 
import { useOrdenes } from '@/hooks/useOrdenes';
import { useReportes } from '@/hooks/useReportes';
import { useImpresion } from '@/hooks/useImpresion';
import { useAccesos } from '@/hooks/useAccesos';
import { useOrdenHandlers } from '@/hooks/useOrdenHandlers';
import { useGastos } from '@/hooks/useGastos';
import { cleanPrice, getFechaBogota } from '@/lib/utils';

import { SITE_CONFIG as RESTAURANTE_CONFIG } from '@/lib/config';
import { PrintTemplates } from '@/components/pos/PrintTemplates';
import ReporteModal from '@/components/modals/ReporteModal';
import AdminModal from '@/components/modals/AdminModal';
import ListaOrdenesModal from '@/components/modals/ListaOrdenesModal';
import TicketPanel from '@/components/pos/TicketPanel';
import ProductGrid from '@/components/pos/ProductGrid';
import styles from './MenuPanel.module.css';

export default function MenuPanel() {
    const { 
        items: cart, total, addProduct: agregarAlCarrito, decrease: quitarDelCarrito, 
        metodoPago, setMetodoPago, setCartFromOrden, clear: clearCart, 
        actualizarComentario, propina, setPropina, montoManual, setMontoManual 
    } = useCart();

    const { 
        ordenes: ordenesActivas, guardarOrden: apiGuardar, 
        eliminarOrden: apiEliminar, refresh: refreshOrdenes 
    } = useOrdenes();

    const [platos, setPlatos] = useState([]);
    const [categoriaActiva, setCategoriaActiva] = useState('todos');
    const [cargando, setCargando] = useState(true);
    const [mostrarListaOrdenes, setMostrarListaOrdenes] = useState(false);
    const [nombreMesero, setNombreMesero] = useState(null);
    const [mostrarCategoriasMobile, setMostrarCategoriasMobile] = useState(false);
    const [mostrarCarritoMobile, setMostrarCarritoMobile] = useState(false);
    const [listaMeseros, setListaMeseros] = useState([]);

    const rep = useReportes(getFechaBogota);
    const imp = useImpresion(cart); 
    const gst = useGastos();
    
    const acc = useAccesos(RESTAURANTE_CONFIG, setNombreMesero, {
        // ✅ Corregido: Activamos modal y cargamos datos con delay para evitar colisión de prompts
        onAdminSuccess: (pin) => { 
            rep.setMostrarAdmin(true); 
            setTimeout(() => {
                rep.cargarReporteAdmin(pin);
            }, 100);
        }
    });

    const ord = useOrdenHandlers({
        cart, total, clearCart, setCartFromOrden, apiGuardar, apiEliminar, 
        refreshOrdenes, ordenesActivas, esModoCajero: acc.esModoCajero, 
        setMostrarCarritoMobile, nombreMesero, setNombreMesero
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (ENV.mode === "template") {
                    setPlatos(DEMO_DATA.platos);
                    setListaMeseros(DEMO_DATA.meseros);
                    setCargando(false);
                    return;
                }

                const [platosData, meserosData] = await Promise.all([
                    getProductos(),
                    getMeseros()
                ]);
                setPlatos(platosData);
                setListaMeseros(meserosData);
                setCargando(false);
            } catch (error) { 
                console.error("Error en MenuPanel:", error); 
            }
        };
        fetchData();
    }, []);

    return (
        <div className={styles.mainWrapper}>
            <div className={styles.posLayout}>
                <TicketPanel 
                    cart={cart} total={total} metodoPago={metodoPago} setMetodoPago={setMetodoPago}
                    quitarDelCarrito={quitarDelCarrito} guardarOrden={ord.guardarOrden} cobrarOrden={() => ord.cobrarOrden(metodoPago)}
                    generarCierreDia={rep.generarCierreDia} solicitarAccesoCajero={acc.solicitarAccesoCajero}
                    solicitarAccesoAdmin={acc.solicitarAccesoAdmin} registrarGasto={gst.registrarGasto}
                    refreshOrdenes={refreshOrdenes} setMostrarListaOrdenes={setMostrarListaOrdenes}
                    mostrarCarritoMobile={mostrarCarritoMobile} setMostrarCarritoMobile={setMostrarCarritoMobile}
                    ordenMesa={ord.ordenMesa} nombreMesero={nombreMesero} setNombreMesero={setNombreMesero}
                    listaMeseros={listaMeseros} esModoCajero={acc.esModoCajero}
                    ordenActivaId={ord.ordenActivaId} numOrdenesActivas={ordenesActivas.length} 
                    cleanPrice={cleanPrice} styles={styles} cancelarOrden={ord.cancelarOrden} 
                    clearCart={clearCart} imprimirTicket={imp.imprimirCliente} 
                    actualizarComentario={actualizarComentario} imprimirComandaCocina={imp.imprimirCocina}
                    propina={propina} setPropina={setPropina} montoManual={montoManual} setMontoManual={setMontoManual}
                />

                <ProductGrid 
                    platos={platos} platosFiltrados={categoriaActiva === 'todos' ? platos : platos.filter(p => p.categoria === categoriaActiva)}
                    categoriaActiva={categoriaActiva} setCategoriaActiva={setCategoriaActiva}
                    mostrarCategoriasMobile={mostrarCategoriasMobile} setMostrarCategoriasMobile={setMostrarCategoriasMobile}
                    agregarAlCarrito={agregarAlCarrito} styles={styles}
                    mostrarCarritoMobile={mostrarCarritoMobile} setMostrarCarritoMobile={setMostrarCarritoMobile}
                />

                <PrintTemplates 
                    cart={cart} total={total} ordenMesa={ord.ordenMesa} 
                    nombreMesero={nombreMesero} config={RESTAURANTE_CONFIG} 
                    agrupadoCliente={imp.agruparParaCliente()} 
                    agrupadoCocina={imp.agruparParaCocina()}
                    ordenActivaId={ord.ordenActivaId}
                    cleanPrice={cleanPrice}
                    propina={propina} montoManual={montoManual}
                />
            </div>

            <div className={styles.tablesFooter}>
                <div style={{ fontWeight: '900', color: 'white', marginRight: '15px', fontSize: '0.75rem' }}>MESAS ACTIVAS:</div>
                {ordenesActivas.map((orden) => (
                    <button key={orden._id} className={`${styles.tableBtn} ${ord.ordenActivaId === orden._id ? styles.tableBtnActive : ''}`} onClick={() => ord.cargarOrden(orden._id)}>
                        {orden.mesa}
                    </button>
                ))}
            </div>

            <ListaOrdenesModal isOpen={mostrarListaOrdenes} onClose={() => setMostrarListaOrdenes(false)} ordenes={ordenesActivas} onCargar={(id) => { ord.cargarOrden(id).then(s => s && setMostrarListaOrdenes(false)) }} />
            <ReporteModal isOpen={rep.mostrarReporte} onClose={() => rep.setMostrarReporte(false)} cargando={rep.cargandoReporte} datos={rep.datosReporte} fechaInicio={rep.fechaInicioReporte} setFechaInicio={rep.setFechaInicioReporte} fechaFin={rep.fechaFinReporte} setFechaFin={rep.setFechaFinReporte} onGenerar={rep.generarCierreDia} listaGastos={rep.listaGastosDetallada} />
            
            <AdminModal 
                isOpen={rep.mostrarAdmin} 
                onClose={() => rep.setMostrarAdmin(false)} 
                fechaInicio={rep.fechaInicioFiltro} 
                setFechaInicio={rep.setFechaInicioFiltro} 
                fechaFin={rep.fechaFinFiltro} 
                setFechaFin={rep.setFechaFinFiltro} 
                onGenerar={() => rep.cargarReporteAdmin()} 
                cargando={rep.cargandoAdmin} 
                reporte={rep.reporteAdmin} 
            />
        </div>
    );
}