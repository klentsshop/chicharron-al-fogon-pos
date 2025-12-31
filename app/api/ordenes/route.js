import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const body = await req.json();
        const { mesa, mesero, platosOrdenados, ordenId } = body;

        // 🔥 MAPEO CRÍTICO: Aseguramos que 'comentario' llegue a Sanity
        const platosParaSanity = platosOrdenados.map(p => ({
            _key: p.lineId || Math.random().toString(36).substring(2, 11),
            _type: 'platoOrdenado', // Asegúrate de que coincida con tu esquema
            nombrePlato: p.nombre || p.nombrePlato,
            cantidad: Number(p.cantidad) || 1,
            precioUnitario: Number(p.precioNum || p.precioUnitario || 0),
            subtotal: Number(p.subtotalNum || p.subtotal || 0),
            // ✅ AQUÍ ESTABA EL ERROR: Se debe enviar como 'comentario'
            comentario: p.comentario || "" 
        }));

        const doc = {
            _type: 'ordenActiva',
            mesa: mesa || 'Mesa Sin Nombre',
            mesero: mesero || 'Mesero',
            platosOrdenados: platosParaSanity,
            fechaCreacion: new Date().toISOString(),
        };

        let resultado;
        if (ordenId) {
            // Actualizar mesa existente
            resultado = await sanityClientServer
                .patch(ordenId)
                .set({
                    mesa: doc.mesa,
                    mesero: doc.mesero,
                    platosOrdenados: doc.platosOrdenados
                })
                .commit();
        } else {
            // Crear mesa nueva
            resultado = await sanityClientServer.create(doc);
        }

        return NextResponse.json(resultado, { status: 201 });

    } catch (err) {
        console.error('[API_ORDENES_ERROR]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}