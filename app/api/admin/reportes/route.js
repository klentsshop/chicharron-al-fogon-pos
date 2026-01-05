import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const { fechaInicio, fechaFin, pinAdmin } = body; 

        // 🛡️ 1. VALIDACIÓN DE PRIVACIDAD
        const seguridad = await sanityClientServer.fetch(
            `*[_type == "seguridad"][0]{ pinAdmin }`,
            {}, 
            { useCdn: false }
        );

        const PIN_ADMIN_REAL = seguridad?.pinAdmin || process.env.PIN_ADMIN;

        if (!pinAdmin || pinAdmin !== PIN_ADMIN_REAL) {
            return NextResponse.json(
                { error: '⚠️ No autorizado. PIN administrativo incorrecto.' },
                { status: 401 }
            );
        }

        if (!fechaInicio || !fechaFin) {
            return NextResponse.json(
                { error: 'Faltan rangos de fecha' },
                { status: 400 }
            );
        }

        const inicio = fechaInicio;
        const fin = fechaFin;

        // 2. Consulta de Ventas (BLINDADA + COMPATIBLE CON VENTAS ANTIGUAS)
        const queryVentas = `*[_type == "venta" && (
            (fecha >= $inicio && fecha <= $fin) ||
            (_createdAt >= $inicio && _createdAt <= $fin)
        )]{
            "totalPagado": coalesce(totalPagado, 0),
            "propinaRecaudada": coalesce(propinaRecaudada, 0),
            mesero,
            metodoPago,
            platosVendidosV2,
            fecha,
            _createdAt
        }`;

        // 3. Consulta de Gastos
        const queryGastos = `*[_type == "gasto" && (
            fecha >= $inicio && fecha <= $fin
        )]{
            monto,
            descripcion,
            fecha
        }`;

        const [ventas, gastos] = await Promise.all([
            sanityClientServer.fetch(queryVentas, { inicio, fin }, { useCdn: false }),
            sanityClientServer.fetch(queryGastos, { inicio, fin }, { useCdn: false })
        ]);

        // 📊 4. PROCESAMIENTO ESTRATÉGICO PARA EL DUEÑO
        const metodosPago = { efectivo: 0, tarjeta: 0, digital: 0 };
        const rankingPlatos = {};
        let totalPropinas = 0;

        ventas?.forEach(v => {
            const ventaNeta = Number(v.totalPagado || 0);
            const propina = Number(v.propinaRecaudada || 0);

            totalPropinas += propina;

            const metodo = (v.metodoPago || 'efectivo').toLowerCase();

            if (metodosPago.hasOwnProperty(metodo)) {
                metodosPago[metodo] += ventaNeta;
            } else {
                metodosPago.efectivo += ventaNeta;
            }

            v.platosVendidosV2?.forEach(p => {
                const nombre = p.nombrePlato || "Desconocido";
                rankingPlatos[nombre] =
                    (rankingPlatos[nombre] || 0) + (Number(p.cantidad) || 0);
            });
        });

        return NextResponse.json({ 
            ventas: ventas || [], 
            gastos: gastos || [],
            estadisticas: {
                metodosPago,
                totalPropinas,
                topPlatos: Object.entries(rankingPlatos)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
            }
        });

    } catch (error) {
        console.error('[REPORT_API_ERROR]:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
