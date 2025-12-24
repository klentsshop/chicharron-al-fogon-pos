import React, { useState, useEffect } from 'react';
import { formatPrecioDisplay, METODOS_PAGO } from '@/lib/utils';

// Componente interno para blindar el foco del input de comentarios
function InputComentario({ item, actualizarComentario }) {
    const [texto, setTexto] = useState(item.comentario || '');

    useEffect(() => {
        setTexto(item.comentario || '');
    }, [item.comentario]);

    return (
        <input 
            type="text"
            placeholder="📝 Notas para cocina..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => actualizarComentario(item._id, texto)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') actualizarComentario(item._id, texto);
            }}
            style={{ 
                marginTop: '6px', padding: '5px 8px', fontSize: '0.75rem', 
                border: '1px dashed #D1D5DB', borderRadius: '4px', 
                backgroundColor: 'white', color: '#4B5563', outline: 'none', width: '100%'
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
    imprimirTicket,
    imprimirComandaCocina,
    actualizarComentario 
}) {
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
            <div style={{ padding: '8px 12px', background: '#1f2937', color: 'white', flexShrink: 0 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 onClick={solicitarAccesoCajero} 
                        style={{ 
                            fontSize: '0.95rem', 
                            margin: 0, 
                            cursor: 'pointer', 
                            fontWeight: 'bold',
                            color: esModoCajero ? '#10B981' : 'white' 
                        }}>
                        PEDIDO {ordenMesa ? `(${ordenMesa})` : 'ACTUAL'} ({esModoCajero ? 'CAJERO' : 'MESERO'})
                    </h2>

                    <select 
                        value={nombreMesero || ""} 
                        onChange={(e) => setNombreMesero(e.target.value)}
                        style={{ 
                            padding: '2px 4px', 
                            borderRadius: '5px', 
                            border: '1px solid #4B5563', 
                            backgroundColor: '#374151', 
                            color: 'white', 
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            width: 'auto',
                            maxWidth: '105px'
                        }}
                    >
                        <option value="">👤 Mesero...</option>
                        {listaMeseros?.map(m => (
                            <option key={m._id} value={m.nombre}>{m.nombre}</option>
                        ))}
                    </select>
                </div>
                
                {/* FILA DE BOTONES DE CONTROL */}
                <div style={{ display: 'flex', gap: '3px' }}>
                    <button onClick={() => { refreshOrdenes(); setMostrarListaOrdenes(true); }} 
                        style={{ flex: 1, padding: '6px 2px', backgroundColor: '#9CA3AF', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        ÓRDENES ({numOrdenesActivas})
                    </button>

                    {ordenActivaId && esModoCajero && (
                        <button 
                            onClick={cancelarOrden} 
                            style={{ flex: 1, padding: '6px 2px', fontSize: '0.6rem', backgroundColor: '#000', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            BORRAR
                        </button>
                    )}

                    <button 
                        onClick={() => esModoCajero ? generarCierreDia() : alert("🔒 Solo cajero")} 
                        style={{ 
                            flex: 1, padding: '6px 2px', fontSize: '0.6rem', 
                            backgroundColor: esModoCajero ? '#EF4444' : '#4B5563', 
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
                        style={{ flex: 1, padding: '6px 2px', fontSize: '0.6rem', backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                        + GASTO
                    </button>
                </div>
            </div>

            {/* 3. LISTADO DE PRODUCTOS (SCROLL DINÁMICO) */}
            <div style={{ 
                flex: 1, 
                minHeight: 0, 
                overflowY: 'auto', 
                padding: '10px 15px',
                background: '#f9fafb'
            }}>
                {cart.length === 0 ? <p style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '20px' }}>Carrito vacío</p> : 
                    cart.map(item => (
                        <div key={item._id} style={{ display: 'flex', flexDirection: 'column', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#111827' }}>{item.nombre}</strong><br/>
                                    <small style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                                        ${formatPrecioDisplay(item.precio).toLocaleString('es-CO')} x {item.cantidad}
                                    </small>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <strong style={{ fontSize: '0.9rem' }}>${(cleanPrice(item.precio) * item.cantidad).toLocaleString('es-CO')}</strong>
                                    <button onClick={() => quitarDelCarrito(item._id)} 
                                        style={{ color: '#EF4444', border: '1px solid #EF4444', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', background: 'none' }}>-</button>
                                </div>
                            </div>

                            {/* Campo de Notas Integrado */}
                            <InputComentario item={item} actualizarComentario={actualizarComentario} />
                        </div>
                    ))
                }
            </div>

            {/* 4. PIE DE PÁGINA - PAGOS, TOTAL Y ACCIONES (FIJO) */}
            <div style={{ padding: '10px 15px', background: 'white', borderTop: '2px solid #eee', flexShrink: 0 }}>
                
                {/* Métodos de Pago */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {METODOS_PAGO.map(m => (
                        <button key={m.value} onClick={() => setMetodoPago(m.value)}
                            style={{
                                flex: 1, padding: '8px 2px', borderRadius: '5px', border: 'none', fontSize: '0.65rem', fontWeight: 'bold',
                                backgroundColor: metodoPago === m.value ? '#10B981' : '#F3F4F6',
                                color: metodoPago === m.value ? 'white' : 'black', cursor: 'pointer'
                            }}>
                            {m.title}
                        </button>
                    ))}
                </div>

                {/* Total Visual */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: '900', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#374151' }}>TOTAL</span>
                    <span>${total.toLocaleString('es-CO')}</span>
                </div>

                {/* BOTONES DE ACCIÓN PRINCIPAL */}
                <div className={styles.actionButtonsRow} style={{ display: 'flex', gap: '4px' }}>
                    {cart.length > 0 && (
                        <>
                            <button onClick={imprimirTicket} 
                                style={{ flex: 0.5, padding: '12px 2px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.65rem', cursor: 'pointer' }}>
                                🖨️ CLIENTE
                            </button>
                            <button onClick={imprimirComandaCocina} 
                                style={{ flex: 0.5, padding: '12px 2px', backgroundColor: '#1F2937', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.65rem', cursor: 'pointer' }}>
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
                            style={{ flex: 1, padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                            COBRAR
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}