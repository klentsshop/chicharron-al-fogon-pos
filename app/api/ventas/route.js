import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
    try {
        const payload = await req.json();

        const mesa = payload.mesa || 'General';
        const mesero = payload.mesero || 'Personal General';
        const metodoPago = payload.metodoPago || 'efectivo';
        const totalPagado = Number(payload.totalPagado) || 0;
        const propinaRecaudada = Number(payload.propinaRecaudada) || 0;
        const ordenId = payload.ordenId;

        // 🕒 FECHA REAL COLOMBIA (CORTE A MEDIANOCHE)
        const nowColombia = new Date(
            new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' })
        );

        // --- FOLIO PROFESIONAL (TAL-AAMMDD-XXXX) ---
        const datePart = nowColombia
            .toISOString()
            .slice(2, 10)
            .replace(/-/g, '');

        const randomPart = crypto
            .randomBytes(2)
            .toString('hex')
            .toUpperCase();

        const folioGenerado = `TAL-${datePart}-${randomPart}`;

        // --- MAPEO DE PLATOS VENDIDOS ---
        const platosVenta = (payload.platosVendidosV2 || []).map(item => ({
            _key: crypto.randomUUID(),
            _type: 'platoVendidoV2',
            nombrePlato: item.nombrePlato,
            cantidad: Number(item.cantidad) || 1,
            precioUnitario: Number(item.precioUnitario) || 0,
            subtotal: Number(item.subtotal) || 0,
            comentario: item.comentario || ""
        }));

        const objetoVenta = {
            _type: 'venta',
            folio: folioGenerado,
            mesa: mesa,
            mesero: mesero,
            metodoPago: metodoPago,
            totalPagado: totalPagado,
            propinaRecaudada: propinaRecaudada,
            fecha: nowColombia.toISOString(), // ✅ FECHA CORREGIDA
            platosVendidosV2: platosVenta,
        };

        // --- TRANSACCIÓN ATÓMICA ---
        let transaction = sanityClientServer
            .transaction()
            .create(objetoVenta);

        if (ordenId) {
            transaction = transaction.delete(ordenId);
        }

        await transaction.commit();

        return NextResponse.json({
            ok: true,
            message: 'Venta registrada y mesa liberada',
            folio: folioGenerado
        }, { status: 201 });

    } catch (err) {
        console.error('🔥 [FATAL_ERROR_VENTAS]:', err);
        return NextResponse.json({
            ok: false,
            error: 'Error en la transacción',
            details: err.message
        }, { status: 500 });
    }
}
