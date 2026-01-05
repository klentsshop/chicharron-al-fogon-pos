'use client';

import React, { useState, useEffect } from 'react';
import { formatPrecioDisplay, METODOS_PAGO } from '@/lib/utils';
// ✅ Importamos la configuración maestra para volverlo vendible
import { SITE_CONFIG } from '@/lib/config';

/**
 * 🛡️ COMPONENTE INTERNO: InputComentario
 */
function InputComentario({ item, actualizarComentario }) {
    const [texto, setTexto] = useState(item.comentario || '');

    useEffect(() => {
        setTexto(item.comentario || '');
    }, [item.comentario]);

    return (
        <input 
            type="text"
            placeholder="📝 Notas para cocina (Ej: Sin sopa)..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => actualizarComentario(item.lineId, texto)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    actualizarComentario(item.lineId, texto);
                    e.target.blur();
                }
            }}
            style={{ 
                marginTop: '6px', 
                padding: '6px 10px', 
                fontSize: '0.85rem', 
                border: '1px dashed #D1D5DB', 
                borderRadius: '6px', 
                backgroundColor: 'white', 
                color: SITE_CONFIG.theme.textDark, 
                outline: 'none', 
                width: '100%'
            }}
        />
    );
}

export default function TicketPanel({
    cart, total, metodoPago, setMetodoPago, quitarDelCarrito,
    guardarOrden, cobrarOrden, generarCierreDia, solicitarAccesoCajero,
    solicitarAccesoAdmin, registrarGasto, refreshOrdenes, setMostrarListaOrdenes,
    mostrarCarritoMobile, setMostrarCarritoMobile, ordenMesa, nombreMesero,
    setNombreMesero, listaMeseros, 
    esModoCajero, ordenActivaId, numOrdenesActivas, cleanPrice, styles,
    cancelarOrden,
    clearCart, 
    imprimirTicket, 
    imprimirComandaCocina, 
    actualizarComentario,
    propina = 0, setPropina, // 👈 Props para propina
    montoManual = 0, setMontoManual // 👈 Props para monto manual
}) {
    // 🔍 Mejora: Función para limpiar el emoji del título y evitar el doble icono
    const limpiarIconoDeTexto = (texto) => {
        const partes = texto.split(' ');
        if (partes.length > 1) return partes.slice(1).join(' '); // Retorna el texto sin el primer elemento (emoji)
        return texto;
    };

    // Buscamos el icono dinámico para el selector de pago
    const iconoPagoActual = METODOS_PAGO.find(m => m.value === metodoPago)?.title.split(' ')[0] || '💰';

    return (
        <div 
            className={`${styles.ticketPanel} ${mostrarCarritoMobile ? styles.ticketPanelShowMobile : ''}`}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            
            {/* 1. BOTÓN VOLVER (MÓVIL) */}
            <div onClick={() => setMostrarCarritoMobile(false)} className={styles.closeCartMobile}>
                ▼ TOCAR PARA VOLVER A LOS PLATOS
            </div>

            {/* 2. CABECERA - ROLES Y MESEROS */}
            <div style={{ padding: '8px 12px', background: SITE_CONFIG.theme.dark, color: 'white', flexShrink: 0 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 onClick={solicitarAccesoCajero} 
                            style={{ 
                                fontSize: '0.95rem', 
                                margin: 0, 
                                cursor: 'pointer', 
                                fontWeight: 'bold',
                                color: esModoCajero ? SITE_CONFIG.theme.primary : 'white' 
                            }}>
                            {SITE_CONFIG.brand.shortName.toUpperCase()} {ordenMesa ? `(${ordenMesa})` : 'ACTUAL'}
                        </h2>

                        {cart.length > 0 && (
                            <button 
                                onClick={() => {
                                    if (typeof clearCart === 'function') {
                                        clearCart(); 
                                        if (typeof setNombreMesero === 'function') setNombreMesero(null);
                                    }
                                }}
                                title="Nueva Orden (Limpiar pantalla)"
                                style={{
                                    width: '22px', height: '22px', borderRadius: '50%',
                                    backgroundColor: '#4B5563', color: 'white', border: 'none',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <select 
                        value={nombreMesero || ""} 
                        onChange={(e) => setNombreMesero(e.target.value)}
                        style={{ 
                            padding: '2px 4px', borderRadius: '5px', border: `1px solid ${SITE_CONFIG.theme.textDark}`, 
                            backgroundColor: '#374151', color: 'white', fontSize: '0.75rem', fontWeight: 'bold',
                            width: 'auto', maxWidth: '105px'
                        }}
                    >
                        <option value="">👤 Mesero...</option>
                        {esModoCajero && <option value="Caja">💰 Caja (Auto)</option>}
                        {listaMeseros?.map(m => (
                            <option key={m._id} value={m.nombre}>{m.nombre}</option>
                        ))}
                    </select>
                </div>
                
                <div style={{ display: 'flex', gap: '3px' }}>
                    <button onClick={() => { refreshOrdenes(); setMostrarListaOrdenes(true); }} 
                        style={{ flex: 1, padding: '6px 2px', backgroundColor: '#9CA3AF', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        ÓRDENES ({numOrdenesActivas})
                    </button>

                    {ordenActivaId && esModoCajero && (
                        <button 
                            onClick={cancelarOrden} 
                            style={{ flex: 1, padding: '6px 2px', fontSize: '0.6rem', backgroundColor: '#000', color: SITE_CONFIG.theme.danger, border: `1px solid ${SITE_CONFIG.theme.danger}`, borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            BORRAR
                        </button>
                    )}

                    <button 
                        onClick={() => esModoCajero ? generarCierreDia() : alert("🔒 Solo el cajero puede ver reportes")} 
                        style={{ 
                            flex: 1, padding: '6px 2px', fontSize: '0.6rem', 
                            backgroundColor: esModoCajero ? SITE_CONFIG.theme.danger : '#4B5563', 
                            color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', 
                            cursor: esModoCajero ? 'pointer' : 'not-allowed', opacity: esModoCajero ? 1 : 0.6
                        }}>
                        REPORTE
                    </button>
                    
                    <button onClick={solicitarAccesoAdmin} 
                        style={{ flex: 1, padding: '6px 2px', fontSize: '0.6rem', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                        ADMIN
                    </button>

                    <button onClick={registrarGasto} 
                        style={{ flex: 1, padding: '6px 2px', fontSize: '0.6rem', backgroundColor: SITE_CONFIG.theme.accent, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                        + GASTO
                    </button>
                </div>
            </div>

            {/* 3. LISTADO DE PRODUCTOS (RESTAURADA ALINEACIÓN Y LÓGICA DE ORDENAMIENTO) */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 15px', background: '#f9fafb' }}>
                {cart.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '20px' }}>No hay productos seleccionados</p>
                ) : (
                    [...cart]
                        .sort((a, b) => {
                            const catA = (a.categoria || "").toLowerCase();
                            const catB = (b.categoria || "").toLowerCase();
                            if (catA === SITE_CONFIG.logic.drinkCategory && catB !== SITE_CONFIG.logic.drinkCategory) return 1;
                            if (catA !== SITE_CONFIG.logic.drinkCategory && catB === SITE_CONFIG.logic.drinkCategory) return -1;
                            const nameA = a.nombre.toLowerCase();
                            const nameB = b.nombre.toLowerCase();
                            const esPriA = SITE_CONFIG.logic.priorityKeywords.some(k => nameA.includes(k));
                            const esPriB = SITE_CONFIG.logic.priorityKeywords.some(k => nameB.includes(k));
                            if (esPriA && !esPriB) return -1;
                            if (!esPriA && esPriB) return 1;
                            return nameA.localeCompare(nameB);
                        })
                        .map(item => (
                        <div key={item.lineId} style={{ display: 'flex', flexDirection: 'column', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <strong style={{ fontSize: '1.05rem', color: '#111827', lineHeight: '1.2' }}>{item.nombre}</strong><br/>
                                    <small style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                        ${(item.precioNum || 0).toLocaleString(SITE_CONFIG.brand.currency)} x {item.cantidad}
                                    </small>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <strong style={{ fontSize: '1rem', fontWeight: '700' }}>
                                        {((item.precioNum || 0) * item.cantidad).toLocaleString(SITE_CONFIG.brand.currency)}
                                    </strong>
                                    <button onClick={() => quitarDelCarrito(item.lineId)} 
                                        style={{ color: SITE_CONFIG.theme.danger, border: `1px solid ${SITE_CONFIG.theme.danger}`, borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', background: 'none', fontWeight: 'bold' }}>
                                        -
                                    </button>
                                </div>
                            </div>
                            <InputComentario item={item} actualizarComentario={actualizarComentario} />
                        </div>
                    ))
                )}
            </div>

            {/* 4. PIE DE PÁGINA - SELECTORES MEJORADOS Y CAMPO OTRO */}
            <div style={{ padding: '12px 15px', background: 'white', borderTop: '2px solid #eee', flexShrink: 0 }}>
                
                {/* 💳 SELECTORES: PAGO, PROPINA Y CAMPO OTRO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>{iconoPagoActual}</span>
                            <select 
                                value={metodoPago} 
                                onChange={(e) => setMetodoPago(e.target.value)}
                                style={{ 
                                    width: '100%', padding: '10px 10px 10px 32px', borderRadius: '8px', border: '1px solid #D1D5DB',
                                    backgroundColor: '#FFFFFF', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', cursor: 'pointer'
                                }}
                            >
                                {METODOS_PAGO.map(m => (
                                    <option key={m.value} value={m.value}>
                                        {limpiarIconoDeTexto(m.title).toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1, position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>🎁</span>
                            <select 
                                value={propina} 
                                onChange={(e) => {
                                    setPropina(Number(e.target.value));
                                    if (Number(e.target.value) !== -1) setMontoManual(0);
                                }}
                                style={{ 
                                    width: '100%', padding: '10px 10px 10px 32px', borderRadius: '8px', border: '1px solid #D1D5DB',
                                    backgroundColor: '#FFFFFF', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', cursor: 'pointer'
                                }}
                            >
                                <option value="0">SIN PROPINA (0%)</option>
                                <option value="10">SUGERIDA (10%)</option>
                                <option value="5">CORTESÍA (5%)</option>
                                <option value="-1">VALOR MANUAL ($)</option>
                            </select>
                        </div>
                    </div>

                    {/* 💰 CAMPO PARA MONTO MANUAL (Solo aparece si se elige valor manual) */}
                    {propina === -1 && (
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: '#10B981' }}>$</span>
                            <input 
                                type="number"
                                placeholder="Escriba valor de propina..."
                                value={montoManual || ''}
                                onChange={(e) => setMontoManual(Number(e.target.value))}
                                style={{ width: '100%', padding: '10px 10px 10px 25px', borderRadius: '8px', border: '2px solid #10B981', outline: 'none', fontWeight: 'bold' }}
                            />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: '900', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: SITE_CONFIG.theme.textDark }}>TOTAL</span>
                    <span>{SITE_CONFIG.brand.symbol}{total.toLocaleString(SITE_CONFIG.brand.currency)}</span>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    {cart.length > 0 && (
                        <>
                            <button onClick={imprimirTicket} 
                                style={{ flex: 0.5, padding: '12px 2px', backgroundColor: SITE_CONFIG.theme.secondary, color: 'white', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.65rem', cursor: 'pointer' }}>
                                🖨️ CLIENTE
                            </button>
                            <button onClick={imprimirComandaCocina} 
                                style={{ flex: 0.5, padding: '12px 2px', backgroundColor: SITE_CONFIG.theme.dark, color: 'white', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.65rem', cursor: 'pointer' }}>
                                👨‍🍳 COCINA
                            </button>
                        </>
                    )}
                    <button onClick={guardarOrden} 
                        style={{ flex: 1, padding: '12px', backgroundColor: '#fbbf24', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                        {ordenActivaId ? 'ACTUALIZAR' : 'GUARDAR'}
                    </button>
                    {esModoCajero && (
                        <button onClick={cobrarOrden} 
                            style={{ flex: 1, padding: '12px', backgroundColor: SITE_CONFIG.theme.primary, color: 'white', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                            COBRAR
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}