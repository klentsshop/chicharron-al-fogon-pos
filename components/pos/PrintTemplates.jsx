import React from 'react';
import styles from '@/app/MenuPanel.module.css';
import { SITE_CONFIG } from '@/lib/config';

export const PrintTemplates = ({
    cart,
    total,
    ordenMesa,
    nombreMesero,
    config,
    agrupadoCliente,
    agrupadoCocina,
    ordenActivaId,
    cleanPrice,
    propina = 0,
    montoManual = 0,
    esSoloCocina = false // 👈 control maestro
}) => {
    const activeConfig = SITE_CONFIG.brand;
    const logicConfig = SITE_CONFIG.logic;

    if (!activeConfig) return null;

    // ================= CÁLCULOS =================
    const subtotalProductos = (agrupadoCliente || []).reduce(
        (acc, it) => acc + (it.subtotal || 0),
        0
    );

    const valorPropinaSugerida =
        propina === -1 ? 0 : subtotalProductos * (propina / 100);

    const propinaTotal = valorPropinaSugerida + Number(montoManual);

    return (
        <div className={styles.printArea}>

            {/* ======================================================
                =================== TICKET CLIENTE ===================
                ====================================================== */}
            {!esSoloCocina && (
                <div id="ticket-print" className="seccion-impresion-termica">
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <h2 style={{ margin: '0 0 5px', fontSize: '1.4rem' }}>
                            {activeConfig.name}
                        </h2>

                        {activeConfig.nit && (
                            <p style={{ margin: 0 }}>NIT: {activeConfig.nit}</p>
                        )}
                        <p style={{ margin: 0 }}>{activeConfig.address}</p>
                        {activeConfig.phone && (
                            <p style={{ margin: 0 }}>Tel: {activeConfig.phone}</p>
                        )}

                        <div
                            style={{
                                margin: '10px 0',
                                borderTop: '1px dashed black',
                                borderBottom: '1px dashed black',
                                padding: '6px 0'
                            }}
                        >
                            <strong>
                                {ordenActivaId
                                    ? '--- PRE-CUENTA ---'
                                    : '--- COMPROBANTE ---'}
                            </strong>
                            <br />
                            <span style={{ fontSize: '0.8rem' }}>
                                Mesa: {ordenMesa || 'Mostrador'}
                            </span>
                        </div>

                        {/* ✅ ALINEACIÓN MEJORADA: Quitamos fixed para que los nombres fluyan */}
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                marginBottom: '5px'
                            }}
                        >
                            <thead>
                                <tr style={{ borderBottom: '1px solid black' }}>
                                    <th style={{ textAlign: 'left', width: '15%' }}>Cant</th>
                                    <th style={{ textAlign: 'left', width: '60%' }}>Producto</th>
                                    <th style={{ textAlign: 'right', width: '25%' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(agrupadoCliente || []).map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ verticalAlign: 'top', textAlign: 'left', padding: '4px 0' }}>
                                            {item.cantidad}
                                        </td>
                                        <td style={{ 
                                            textAlign: 'left', 
                                            wordBreak: 'break-word', 
                                            padding: '4px 2px',
                                            lineHeight: '1.2' 
                                        }}>
                                            {item.nombre || item.nombrePlato}
                                        </td>
                                        <td style={{ verticalAlign: 'top', textAlign: 'right', padding: '4px 0' }}>
                                            {activeConfig.symbol}
                                            {(item.subtotal || 0).toLocaleString(
                                                activeConfig.currency
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div
                            style={{
                                marginTop: '10px',
                                borderTop: '1px solid black',
                                paddingTop: '8px',
                                width: '100%'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <span style={{ textAlign: 'left' }}>Subtotal:</span>
                                <span style={{ textAlign: 'right' }}>
                                    {activeConfig.symbol}
                                    {subtotalProductos.toLocaleString(activeConfig.currency)}
                                </span>
                            </div>

                            {propinaTotal > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '2px' }}>
                                    <span style={{ textAlign: 'left' }}>Propina / Servicio:</span>
                                    <span style={{ textAlign: 'right' }}>
                                        {activeConfig.symbol}
                                        {propinaTotal.toLocaleString(activeConfig.currency)}
                                    </span>
                                </div>
                            )}

                            <div
                                style={{
                                    marginTop: '6px',
                                    borderTop: '2px solid black',
                                    paddingTop: '6px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem'
                                }}
                            >
                                <span style={{ textAlign: 'left' }}>TOTAL:</span>
                                <span style={{ textAlign: 'right' }}>
                                    {activeConfig.symbol}
                                    {(total || 0).toLocaleString(activeConfig.currency)}
                                </span>
                            </div>
                        </div>

                        {activeConfig.mensajeTicket && (
                            <p style={{ marginTop: '12px', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                {activeConfig.mensajeTicket}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ======================================================
                ================= COMANDA DE COCINA (DISEÑO PRO) =====
                ====================================================== */}
            {esSoloCocina && (
                <div id="comanda-print" className="seccion-impresion-termica" style={{ padding: '0 5px' }}>
                    <div style={{ textAlign: 'center', width: '100%', maxWidth: '80mm', margin: '0 auto' }}>
                        <h2
                            style={{
                                fontSize: '2.2rem',
                                borderBottom: '3px solid black',
                                marginBottom: '8px',
                                paddingBottom: '5px',
                                fontWeight: '900'
                            }}
                        >
                            MESA: {(ordenMesa || 'MOSTRADOR').toUpperCase()}
                        </h2>

                        <p style={{ fontSize: '1.2rem', margin: '5px 0' }}>
                            <strong>MESERO:</strong> {(nombreMesero || 'General').toUpperCase()}
                        </p>

                        <hr style={{ border: '1px dashed black', margin: '10px 0' }} />

                        <table style={{ width: '100%', fontSize: '1.5rem', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid black' }}>
                                    <th style={{ width: '15%', textAlign: 'left', padding: '5px 0' }}>CT</th>
                                    <th style={{ width: '85%', textAlign: 'left', padding: '5px 0' }}>PEDIDO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const bebidaKeywords = ['agua', 'gaseosa', 'jugo', 'coca', 'pepsi', 'sprite', 'cerveza', 'hielo'];
                                    const rawData = (agrupadoCocina && agrupadoCocina.length > 0) ? agrupadoCocina : (agrupadoCliente || []);

                                    const platos = rawData.filter(i => {
                                        const n = (i.nombre || i.nombrePlato || "").toLowerCase();
                                        return !bebidaKeywords.some(k => n.includes(k));
                                    });

                                    const bebidas = rawData.filter(i => {
                                        const n = (i.nombre || i.nombrePlato || "").toLowerCase();
                                        return bebidaKeywords.some(k => n.includes(k));
                                    });

                                    const renderRow = (item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ fontWeight: '900', verticalAlign: 'top', paddingTop: '8px', fontSize: '1.8rem' }}>
                                                {item.cantidad}
                                            </td>
                                            <td style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                                                <strong style={{ display: 'block', lineHeight: '1.1', textAlign: 'left' }}>
                                                    {(item.nombre || item.nombrePlato || "").toUpperCase()}
                                                </strong>
                                                {item.comentario && (
                                                    <div style={{
                                                        marginTop: '5px',
                                                        border: '2px solid black',
                                                        padding: '4px',
                                                        fontSize: '1.1rem',
                                                        fontWeight: 'bold',
                                                        backgroundColor: '#f0f0f0',
                                                        textAlign: 'left'
                                                    }}>
                                                        * {item.comentario.toUpperCase()} *
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );

                                    return (
                                        <>
                                            {platos.map((item, idx) => renderRow(item, idx))}
                                            {bebidas.length > 0 && (
                                                <tr>
                                                    <td colSpan="2" style={{ textAlign: 'center', padding: '15px 0 5px' }}>
                                                        <strong style={{ border: '1px solid black', padding: '2px 10px', fontSize: '1.2rem' }}>
                                                            --- BEBIDAS ---
                                                        </strong>
                                                    </td>
                                                </tr>
                                            )}
                                            {bebidas.map((item, idx) => renderRow(item, idx))}
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>

                        <div style={{ borderTop: '2px solid black', marginTop: '20px', paddingTop: '10px', fontSize: '1rem', fontWeight: 'bold' }} suppressHydrationWarning>
                            HORA: {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};