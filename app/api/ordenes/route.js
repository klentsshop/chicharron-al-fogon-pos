import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const body = await req.json();
        const { mesa, mesero, platosOrdenados, ordenId } = body;

        // 🧠 MAPEO DE SEGURIDAD: Preparamos los datos para el esquema de Sanity
        const platosParaSanity = platosOrdenados.map(p => ({
            // Usamos el lineId (UUID) que generamos en el CartContext como _key
            _key: p.lineId || p._key || Math.random().toString(36).substring(2, 11),
            _type: 'platoOrdenado', 
            nombrePlato: p.nombre || p.nombrePlato,
            cantidad: Number(p.cantidad) || 1,
            precioUnitario: Number(p.precioNum || p.precioUnitario || 0),
            subtotal: Number(p.subtotalNum || p.subtotal || 0),
            // ✅ Comentario garantizado
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
            // Actualizar mesa existente (PATCH)
            resultado = await sanityClientServer
                .patch(ordenId)
                .set({
                    mesa: doc.mesa,
                    mesero: doc.mesero,
                    platosOrdenados: doc.platosOrdenados,
                    // Actualizamos también la fecha para saber cuándo fue el último cambio
                    ultimaActualizacion: new Date().toISOString()
                })
                .commit();
        } else {
            // Crear mesa nueva (CREATE)
            resultado = await sanityClientServer.create(doc);
        }

        return NextResponse.json(resultado, { status: 201 });

    } catch (err) {
        console.error('🔥 [API_ORDENES_ERROR]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}