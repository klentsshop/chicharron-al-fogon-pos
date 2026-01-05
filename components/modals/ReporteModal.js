import React from 'react';

export default function ReporteModal({ 
    isOpen, onClose, cargando, datos, 
    fechaInicio, setFechaInicio, 
    fechaFin, setFechaFin, 
    onGenerar, listaGastos 
}) {
    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 7000 }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '15px', width: '95%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>📊 Cierre y Análisis</h2>
                    <button onClick={onClose} style={{ fontSize: '1.5em', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ backgroundColor: '#F9FAFB', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #E5E7EB' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>PERIODO: {fechaInicio} al {fechaFin}</p>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>DESDE:</label><input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '5px' }} /></div>
                        <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>HASTA:</label><input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '5px' }} /></div>
                    </div>
                    <button onClick={onGenerar} style={{ width: '100%', padding: '10px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>🔍 ACTUALIZAR</button>
                </div>
                {cargando ? <p style={{ textAlign: 'center' }}>Calculando...</p> : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1F2937', marginBottom: '5px' }}><span>Ventas Netas:</span><strong>${datos.ventas.toLocaleString('es-CO')}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: '5px' }}><span>(+) Propinas:</span><strong>${(datos.totalPropinas || 0).toLocaleString('es-CO')}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626', marginBottom: '10px' }}><span>(-) Gastos:</span><strong>${datos.gastos.toLocaleString('es-CO')}</strong></div>
                        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FEF3C7', padding: '12px', borderRadius: '10px', border: '1px solid #FCD34D', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#92400E' }}>TOTAL RECAUDADO EN CAJA</span>
                            <span style={{ fontSize: '1.6rem', fontWeight: '900' }}>${(datos.ventas + (datos.totalPropinas || 0) - datos.gastos).toLocaleString('es-CO')}</span>
                        </div>
                        <h3 style={{ marginTop: '20px', fontSize: '1rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '5px' }}>🍽️ Productos</h3>
                        <div style={{ backgroundColor: '#F3F4F6', padding: '10px', borderRadius: '8px' }}>
                            {Object.entries(datos.productos).map(([nombre, cant]) => (
                                <div key={nombre} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', padding: '5px 0' }}><span>{nombre}</span><strong>x{cant}</strong></div>
                            ))}
                        </div>
                        <h3 style={{ marginTop: '20px', fontSize: '1rem', borderBottom: '2px solid #FEE2E2', paddingBottom: '5px' }}>💸 Gastos</h3>
                        <div style={{ border: '1px solid #FEE2E2', padding: '10px', borderRadius: '8px' }}>
                            {listaGastos.map((g, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FFF5F5', padding: '5px 0' }}><span>{g.descripcion}</span><strong style={{ color: '#DC2626' }}>${Number(g.monto).toLocaleString('es-CO')}</strong></div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}