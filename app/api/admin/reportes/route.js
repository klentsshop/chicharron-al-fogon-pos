import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';

// Forzamos que Next.js no guarde copias estáticas de este reporte
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const { fechaInicio, fechaFin } = body;

        if (!fechaInicio || !fechaFin) {
            return NextResponse.json({ error: 'Faltan rangos de fecha' }, { status: 400 });
        }

        // 1. Consulta de Ventas
        const queryVentas = `*[_type == "venta" && fecha >= $inicio && fecha <= $fin]{
            totalPagado,
            mesero,
            platosVendidosV2,
            fecha
        }`;

        // 2. Consulta de Gastos
        const queryGastos = `*[_type == "gasto" && fecha >= $inicio && fecha <= $fin]{
            monto,
            descripcion,
            fecha
        }`;

        // 🔥 CLAVE: Agregamos { useCdn: false } para saltar la memoria caché de Sanity
        const [ventas, gastos] = await Promise.all([
            sanityClientServer.fetch(queryVentas, { inicio: fechaInicio, fin: fechaFin }, { useCdn: false }),
            sanityClientServer.fetch(queryGastos, { inicio: fechaInicio, fin: fechaFin }, { useCdn: false })
        ]);

        return NextResponse.json({ 
            ventas: ventas || [], 
            gastos: gastos || [] 
        });

    } catch (error) {
        console.error('[REPORT_API_ERROR]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}