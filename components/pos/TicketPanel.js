import React from 'react';
import { formatPrecioDisplay, METODOS_PAGO } from '@/lib/utils';

export default function TicketPanel({
    cart, total, metodoPago, setMetodoPago, quitarDelCarrito,
    guardarOrden, cobrarOrden, generarCierreDia, solicitarAccesoCajero,
    solicitarAccesoAdmin, registrarGasto, refreshOrdenes, setMostrarListaOrdenes,
    mostrarCarritoMobile, setMostrarCarritoMobile, ordenMesa, nombreMesero,
    esModoCajero, ordenActivaId, numOrdenesActivas, cleanPrice, styles,
    cancelarOrden,
    imprimirTicket 
}) {
    return (
        <div className={`${styles.ticketPanel} ${mostrarCarritoMobile ? styles.ticketPanelShowMobile : ''}`}>
            
            {/* --- BOTÓN PARA VOLVER A LOS PLATOS (SOLO MÓVIL) --- */}
            <div 
                onClick={() => setMostrarCarritoMobile(false)}
                className={styles.closeCartMobile}
            >
                ▼ TOCAR PARA VOLVER A LOS PLATOS
            </div>

            {/* CABECERA - BOTONES DE NAVEGACIÓN */}
            <div style={{ padding: '20px', background: '#1f2937', color: 'white' }}>
                <h2 onClick={solicitarAccesoCajero} 
                    style={{ 
                        fontSize: '1.2rem', 
                        margin: '0 0 15px 0', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        color: esModoCajero ? '#10B981' : 'white' 
                    }}>
                    PEDIDO {ordenMesa ? `(${ordenMesa})` : 'ACTUAL'}
                </h2>
                
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => { refreshOrdenes(); setMostrarListaOrdenes(true); }} 
                        style={{ flex: 1, padding: '10px 4px', backgroundColor: '#9CA3AF', color: 'white', border: 'none', borderRadius: '5px', fontSize: '0.75em', fontWeight: 'bold', cursor: 'pointer' }}>
                        ÓRDENES ({numOrdenesActivas})
                    </button>

                    {ordenActivaId && esModoCajero && (
                        <button 
                            onClick={cancelarOrden} 
                            style={{ flex: 1, padding: '10px 4px', fontSize: '0.75em', backgroundColor: '#000', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            BORRAR
                        </button>
                    )}

                    {/* --- BOTÓN DE REPORTE PROTEGIDO --- */}
                    <button 
                        onClick={() => {
                            if (esModoCajero) {
                                generarCierreDia();
                            } else {
                                alert("🔒 Acceso denegado. Solo el cajero puede generar reportes.");
                            }
                        }} 
                        style={{ 
                            flex: 1, 
                            padding: '10px 4px', 
                            fontSize: '0.75em', 
                            backgroundColor: esModoCajero ? '#EF4444' : '#4B5563', // Rojo si es cajero, Gris si no
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '5px', 
                            fontWeight: 'bold', 
                            cursor: esModoCajero ? 'pointer' : 'not-allowed',
                            opacity: esModoCajero ? 1 : 0.6
                        }}>
                        REPORTE
                    </button>
                    
                    <button onClick={solicitarAccesoAdmin} 
                        style={{ flex: 1, padding: '10px 4px', fontSize: '0.75em', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        ADMIN
                    </button>

                    <button onClick={registrarGasto} 
                        style={{ flex: 1, padding: '10px 4px', fontSize: '0.75em', backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        + GASTO
                    </button>
                </div>
            </div>

            {/* CUERPO - LISTADO DE PRODUCTOS */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                {cart.length === 0 ? <p style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '20px' }}>Carrito vacío</p> : 
                    cart.map(item => (
                        <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <strong style={{ fontSize: '1rem', color: '#111827' }}>{item.nombre}</strong><br/>
                                <small style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                    ${formatPrecioDisplay(item.precio).toLocaleString('es-CO')} x {item.cantidad}
                                </small>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <strong style={{ fontSize: '1rem' }}>${(cleanPrice(item.precio) * item.cantidad).toLocaleString('es-CO')}</strong>
                                <button onClick={() => quitarDelCarrito(item._id)} 
                                    style={{ color: '#EF4444', border: '1px solid #EF4444', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', background: 'none' }}>-</button>
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* PIE - TOTALES Y ACCIONES FINALES */}
            <div style={{ padding: '20px', background: 'white', borderTop: '2px solid #eee' }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                    {METODOS_PAGO.map(m => (
                        <button key={m.value} onClick={() => setMetodoPago(m.value)}
                            style={{
                                flex: 1, padding: '12px 2px', borderRadius: '5px', border: 'none', fontSize: '0.8rem', fontWeight: 'bold',
                                backgroundColor: metodoPago === m.value ? '#10B981' : '#F3F4F6',
                                color: metodoPago === m.value ? 'white' : 'black', cursor: 'pointer'
                            }}>
                            {m.title}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.6rem', fontWeight: '900', marginBottom: '15px' }}>
                    <span style={{ fontSize: '1rem', color: '#374151' }}>TOTAL</span>
                    <span>${total.toLocaleString('es-CO')}</span>
                </div>

                <div className={styles.actionButtonsRow} style={{ display: 'flex', gap: '5px' }}>
                    {cart.length > 0 && (
                        <button onClick={imprimirTicket} 
                            style={{ flex: 0.6, padding: '18px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                            🖨️ TICKET
                        </button>
                    )}

                    <button onClick={guardarOrden} 
                        style={{ flex: 1, padding: '18px', backgroundColor: '#fbbf24', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer' }}>
                        {ordenActivaId ? 'ACTUALIZAR' : 'GUARDAR'}
                    </button>
                    
                    {esModoCajero && (
                        <button onClick={cobrarOrden} 
                            style={{ flex: 1, padding: '18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer' }}>
                            COBRAR
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}