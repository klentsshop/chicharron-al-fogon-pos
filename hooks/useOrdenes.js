// Archivo: app/hooks/useOrdenes.js
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Error al obtener datos');
    return res.json();
});

export function useOrdenes() {
    // ✅ Sincronización Real-Time: SWR consulta al servidor cada 5 segundos.
    // Esto es lo que permite que el Cajero vea lo que el Mesero guarda.
    const { data: ordenes = [], mutate, error } = useSWR('/api/ordenes/list', fetcher, {
        refreshInterval: 5000, 
        revalidateOnFocus: true,
        revalidateOnReconnect: true
    });

    const [cargandoAccion, setCargandoAccion] = useState(false);

    // FUNCIÓN PARA GUARDAR O ACTUALIZAR
    const guardarOrden = async (ordenPayload) => {
        setCargandoAccion(true);
        try {
            // Aseguramos que la orden viaje con estado 'abierta' si es nueva
            const payload = {
                ...ordenPayload,
                estado: ordenPayload.estado || 'abierta'
            };

            const res = await fetch('/api/ordenes/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            if (!res.ok) throw new Error("Error al guardar en servidor");
            
            const data = await res.json();
            
            // ✅ Optimistic UI: Mutate le avisa a todos los dispositivos 
            // que hay datos nuevos y refresca la lista global.
            await mutate(); 
            return data;
        } catch (err) {
            console.error("❌ Error guardarOrden:", err);
            throw err; 
        } finally {
            setCargandoAccion(false);
        }
    };

    // FUNCIÓN PARA ELIMINAR (Tras Cobro o Cancelación)
    const eliminarOrden = async (ordenId) => {
        if (!ordenId) return;
        try {
            const res = await fetch('/api/ordenes/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ordenId }),
            });
            
            if (!res.ok) throw new Error("Error al eliminar");
            
            // Refrescar lista de mesas activas inmediatamente en todos los dispositivos
            await mutate(); 
        } catch (error) {
            console.error("❌ Error al eliminar orden:", error);
        }
    };

    return {
        ordenes,
        guardarOrden,
        eliminarOrden,
        refresh: mutate, 
        cargandoAccion,
        errorConexion: error
    };
}