import React from 'react';

export default function AdminModal({ 
    isOpen, 
    onClose, 
    fechaInicio, 
    setFechaInicio, 
    fechaFin, 
    setFechaFin, 
    onGenerar, 
    cargando, 
    reporte 
}) {
    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', zIndex: 9999 }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '15px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>💼 Panel Administrativo</h2>
                    <button onClick={onClose} style={{ fontSize: '1.5em', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                </div>

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
                    <button onClick={onGenerar} style={{ width: '100%', padding: '10px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        🔍 GENERAR REPORTE
                    </button>
                </div>

                {cargando ? (
                    <p style={{ textAlign: 'center' }}>Cargando datos...</p>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ padding: '15px', background: '#ECFDF5', borderRadius: '10px' }}>
                                <small>Ventas</small><br/>
                                <strong style={{ fontSize: '1.2em' }}>${reporte.ventasTotales.toLocaleString('es-CO')}</strong>
                            </div>
                            <div style={{ padding: '15px', background: '#FEF2F2', borderRadius: '10px' }}>
                                <small>Gastos</small><br/>
                                <strong style={{ fontSize: '1.2em' }}>${reporte.gastos.toLocaleString('es-CO')}</strong>
                            </div>
                        </div>

                        <h3 style={{ marginTop: '20px', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>Ventas por Mesero</h3>
                        {Object.entries(reporte.porMesero).map(([nombre, val]) => (
                            <div key={nombre} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
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