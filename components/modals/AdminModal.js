import React from 'react';

export default function AdminModal({ 
    isOpen, onClose, fechaInicio, setFechaInicio, fechaFin, setFechaFin, onGenerar, cargando, reporte 
}) {
    if (!isOpen) return null;

    // 💡 Cálculo de Balance Neto (Ventas - Gastos)
    const balanceNeto = (reporte?.ventasTotales || 0) - (reporte?.gastos || 0);

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', zIndex: 9999 }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '15px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>💼 Panel Administrativo</h2>
                    <button onClick={onClose} style={{ fontSize: '1.5em', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                </div>

                {/* --- FILTROS DE FECHA --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', backgroundColor: '#F9FAFB', padding: '15px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>DESDE:</label>
                            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>HASTA:</label>
                            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        </div>
                    </div>
                    <button onClick={onGenerar} style={{ width: '100%', padding: '12px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        🔍 GENERAR REPORTE ESTRATÉGICO
                    </button>
                </div>

                {cargando ? (
                    <p style={{ textAlign: 'center', padding: '20px' }}>⌛ Analizando finanzas...</p>
                ) : (
                    <>
                        {/* --- RESUMEN DE IMPACTO (VENTAS, GASTOS, BALANCE) --- */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ padding: '12px', background: '#ECFDF5', borderRadius: '10px', textAlign: 'center' }}>
                                <small style={{ color: '#047857', fontWeight: 'bold' }}>VENTAS</small><br/>
                                <strong style={{ fontSize: '1.1em' }}>${(reporte.ventasTotales || 0).toLocaleString('es-CO')}</strong>
                            </div>
                            <div style={{ padding: '12px', background: '#FEF2F2', borderRadius: '10px', textAlign: 'center' }}>
                                <small style={{ color: '#B91C1C', fontWeight: 'bold' }}>GASTOS</small><br/>
                                <strong style={{ fontSize: '1.1em' }}>${(reporte.gastos || 0).toLocaleString('es-CO')}</strong>
                            </div>
                            <div style={{ padding: '12px', background: balanceNeto >= 0 ? '#EFF6FF' : '#FFF7ED', borderRadius: '10px', textAlign: 'center', border: '1px solid #DBEAFE' }}>
                                <small style={{ color: '#1E40AF', fontWeight: 'bold' }}>UTILIDAD</small><br/>
                                <strong style={{ fontSize: '1.1em' }}>${balanceNeto.toLocaleString('es-CO')}</strong>
                            </div>
                        </div>

                        {/* --- DESGLOSE DE CAJA (MÉTODOS DE PAGO) --- */}
                        <h4 style={{ margin: '15px 0 8px 0', fontSize: '0.9em', color: '#4B5563', textTransform: 'uppercase' }}>💰 Distribución de Caja (Ventas Netas)</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F3F4F6', borderRadius: '8px', fontSize: '0.85em' }}>
                            <div>💵 Efec: <strong>${(reporte.estadisticas?.metodosPago?.efectivo || 0).toLocaleString('es-CO')}</strong></div>
                            <div>💳 Tarj: <strong>${(reporte.estadisticas?.metodosPago?.tarjeta || 0).toLocaleString('es-CO')}</strong></div>
                            <div>📱 Dig: <strong>${(reporte.estadisticas?.metodosPago?.digital || reporte.estadisticas?.metodosPago?.transferencia || 0).toLocaleString('es-CO')}</strong></div>
                        </div>

                        {/* --- 🎁 CONTROL DE PROPINAS --- */}
                        <div style={{ marginTop: '20px', padding: '12px', background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9em', color: '#374151', fontWeight: 'bold' }}>🎁 PROPINAS RECAUDADAS:</span>
                            <strong style={{ fontSize: '1.1em', color: '#111827' }}>${(reporte.estadisticas?.totalPropinas || 0).toLocaleString('es-CO')}</strong>
                        </div>

                        {/* --- RANKING DE PRODUCTOS (BEST SELLERS) --- */}
                        <h4 style={{ margin: '20px 0 8px 0', fontSize: '0.9em', color: '#4B5563', textTransform: 'uppercase' }}>🔥 Top 5 Productos</h4>
                        <div style={{ backgroundColor: 'white', border: '1px solid #F3F4F6', borderRadius: '8px', padding: '5px 12px' }}>
                            {reporte.estadisticas?.topPlatos?.length > 0 ? (
                                reporte.estadisticas.topPlatos.map(([nombre, cant], idx) => (
                                    <div key={nombre} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx === 4 ? 'none' : '1px solid #F3F4F6', fontSize: '0.9em' }}>
                                        <span>{idx + 1}. {nombre}</span>
                                        <strong style={{ color: '#10B981' }}>{cant} und</strong>
                                    </div>
                                ))
                            ) : <p style={{ fontSize: '0.8em', color: '#9CA3AF' }}>Sin datos de platos</p>}
                        </div>

                        {/* --- VENTAS POR MESERO --- */}
                        <h4 style={{ margin: '20px 0 8px 0', fontSize: '0.9em', color: '#4B5563', textTransform: 'uppercase' }}>👤 Ventas por Mesero</h4>
                        {Object.entries(reporte.porMesero || {}).map(([nombre, val]) => (
                            <div key={nombre} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '0.95em' }}>
                                <span>{nombre}</span>
                                <strong>${val.toLocaleString('es-CO')}</strong>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}