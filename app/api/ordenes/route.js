import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. GET: Para listar las órdenes activas (Lo que antes hacía /list)
export async function GET() {
    try {
        const query = `*[_type == "ordenActiva"] | order(fechaCreacion asc) {
            _id,
            mesa,
            mesero,
            fechaCreacion,
            platosOrdenados
        }`;
        const data = await sanityClientServer.fetch(query);
        return NextResponse.json(data || []); 
    } catch (error) {
        console.error('[API_LIST_GET_ERROR]:', error);
        return NextResponse.json([], { status: 500 });
    }
}

// 2. POST: Para crear o actualizar (El corazón del guardado y tickets)
export async function POST(req) {
    try {
        const body = await req.json();
        const { mesa, mesero, platosOrdenados, ordenId } = body;

        const platosParaSanity = platosOrdenados.map(p => ({
            _key: p.lineId || p._key || Math.random().toString(36).substring(2, 11),
            _type: 'platoOrdenado', 
            nombrePlato: p.nombre || p.nombrePlato,
            cantidad: Number(p.cantidad) || 1,
            precioUnitario: Number(p.precioNum || p.precioUnitario || 0),
            subtotal: Number(p.subtotalNum || p.subtotal || 0),
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
            resultado = await sanityClientServer
                .patch(ordenId)
                .set({
                    mesa: doc.mesa,
                    mesero: doc.mesero,
                    platosOrdenados: doc.platosOrdenados,
                    ultimaActualizacion: new Date().toISOString()
                })
                .commit();
        } else {
            resultado = await sanityClientServer.create(doc);
        }

        // ✅ Retornamos el resultado completo para el router.push del ticket
        return NextResponse.json(resultado, { status: 201 });

    } catch (err) {
        console.error('🔥 [API_ORDENES_ERROR]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}