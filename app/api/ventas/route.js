import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';
import crypto from 'crypto';

// 🛡️ Forzamos ejecución dinámica para tiempo real
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
    try {
        const payload = await req.json();
        
        const mesa = payload.mesa || 'General';
        const mesero = payload.mesero || 'Personal General';
        const metodoPago = payload.metodoPago || 'efectivo';
        const totalPagado = Number(payload.totalPagado) || 0;
        const ordenId = payload.ordenId;

        // Mapeo de platos con _key única para el reporte de ventas
        const platosVenta = (payload.platosVendidosV2 || []).map(item => ({
            _key: crypto.randomUUID(), 
            nombrePlato: item.nombrePlato,
            cantidad: Number(item.cantidad) || 1,
            precioUnitario: Number(item.precioUnitario) || 0,
            subtotal: Number(item.subtotal) || 0,
            _type: 'platoVendidoV2' 
        }));

        const objetoVenta = {
            _type: 'venta',
            folio: crypto.randomBytes(3).toString('hex').toUpperCase(),
            mesa: mesa,
            mesero: mesero,
            metodoPago: metodoPago,
            totalPagado: totalPagado,
            fecha: new Date().toISOString(),
            platosVendidosV2: platosVenta,
        };

        // Iniciamos transacción: Crear Venta y Borrar Orden Activa
        let transaction = sanityClientServer.transaction().create(objetoVenta);

        if (ordenId) {
            transaction = transaction.delete(ordenId);
        }

        await transaction.commit();

        return NextResponse.json({ 
            ok: true, 
            message: 'Venta registrada con éxito',
            mesa: mesa,
            mesero: mesero,
            folio: objetoVenta.folio
        }, { status: 201 });

    } catch (err) {
        console.error('[FATAL_ERROR_VENTAS]:', err);
        return NextResponse.json({ 
            ok: false, 
            error: 'Error en la transacción de venta',
            details: err.message 
        }, { status: 500 });
    }
}