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
        const ordenId = payload.ordenId;

        // --- MEJORA 1: Folio con Fecha (Ej: TAL-2312-A1B2) ---
        // Esto ayuda al dueño a identificar ventas por día visualmente
        const datePart = new Intl.DateTimeFormat('es-CO', {
            timeZone: 'America/Bogota',
            year: '2-digit',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date()).replace(/\//g, ''); // 231225
        
        const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
        const folioGenerado = `TAL-${datePart}-${randomPart}`;

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
            folio: folioGenerado, // Folio más profesional
            mesa: mesa,
            mesero: mesero,
            metodoPago: metodoPago,
            totalPagado: totalPagado,
            // --- MEJORA 2: Fecha ISO Completa ---
            // Sanity guarda en UTC por defecto, lo cual es correcto para nuestro filtro frontend
            fecha: new Date().toISOString(), 
            platosVendidosV2: platosVenta,
        };

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