// Archivo: app/hooks/useOrdenes.js
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useOrdenes() {
    // Sincronización automática con la API
    const { data: ordenes = [], mutate } = useSWR('/api/ordenes/list', fetcher, {
        refreshInterval: 5000, // Revisa si hay órdenes nuevas cada 5 segundos
        revalidateOnFocus: true
    });

    const [cargandoAccion, setCargandoAccion] = useState(false);

    // FUNCIÓN PARA GUARDAR O ACTUALIZAR
    const guardarOrden = async (ordenPayload) => {
        setCargandoAccion(true);
        try {
            const res = await fetch('/api/ordenes/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ordenPayload),
            });
            const data = await res.json();
            await mutate(); // Actualiza la lista de órdenes inmediatamente
            return data;
        } finally {
            setCargandoAccion(false);
        }
    };

    // FUNCIÓN PARA ELIMINAR (COBRO)
    const eliminarOrden = async (ordenId) => {
        try {
            await fetch('/api/ordenes/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ordenId }),
            });
            await mutate(); // Refrescar lista
        } catch (error) {
            console.error("Error al eliminar orden:", error);
        }
    };

    return {
        ordenes,
        guardarOrden,
        eliminarOrden,
        refresh: mutate,
        cargandoAccion
    };
}