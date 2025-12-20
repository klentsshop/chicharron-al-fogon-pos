import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';
import crypto from 'crypto';

// 🛡️ Forzamos ejecución dinámica para evitar cualquier caché de ventas
export const dynamic = 'force-dynamic';

function mapAndValidateVenta(payload) {
    const mesa = payload.mesa || 'General';
    const mesero = payload.mesero || 'No asignado'; // 🆕 Capturamos el mesero
    const metodoPago = payload.metodoPago || 'efectivo';
    const totalPagado = Number(payload.totalPagado) || 0;
    
    // Agregamos una _key a cada plato para evitar errores de validación en Sanity
    const platos = (payload.platosVendidosV2 || []).map(item => ({
        _key: crypto.randomUUID(), 
        nombrePlato: item.nombrePlato,
        cantidad: Number(item.cantidad) || 1,
        precioUnitario: Number(item.precioUnitario) || 0,
        subtotal: Number(item.subtotal) || 0,
        _type: 'platoVendidoV2' 
    }));
    
    const ordenId = payload.ordenId || null;

    return {
        venta: {
            _type: 'venta',
            folio: crypto.randomBytes(4).toString('hex').toUpperCase(),
            mesa: mesa,
            mesero: mesero, // 🆕 El mesero ahora queda persistido en el registro de venta
            metodoPago: metodoPago,
            totalPagado: totalPagado,
            fecha: new Date().toISOString(),
            platosVendidosV2: platos,
        },
        ordenId: ordenId
    };
}

export async function POST(req) {
    try {
        const payload = await req.json();
        const { venta, ordenId } = mapAndValidateVenta(payload);

        let transaction = sanityClientServer.transaction();

        // 1. Añadimos la creación de la venta
        transaction = transaction.create(venta);

        // 2. Si venía de una orden activa, la eliminamos EN LA MISMA TRANSACCIÓN
        if (ordenId) {
            transaction = transaction.delete(ordenId);
        }

        await transaction.commit();

        return NextResponse.json(
            { 
                ok: true, 
                message: 'Venta registrada y orden eliminada con éxito',
                folio: venta.folio, 
                mesa: venta.mesa,
                mesero: venta.mesero // Confirmamos el mesero en la respuesta
            },
            { status: 201 }
        );

    } catch (err) {
        console.error('[API_VENTAS_FATAL_ERROR]:', err);
        return NextResponse.json(
            { 
                ok: false, 
                error: 'No se pudo completar la transacción de venta.',
                details: err.message 
            },
            { status: 500 }
        );
    }
}