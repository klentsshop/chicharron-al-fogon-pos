import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';
import crypto from 'crypto';

// 🚀 VITAL: Evita que Netlify cachee la lista de órdenes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Handler para GET: Obtener todas las órdenes para el botón "ÓRDENES (X)"
export async function GET() {
    try {
        const query = `*[_type == "ordenActiva"] | order(fechaCreacion desc) {
            _id,
            mesa,
            mesero,
            fechaCreacion,
            platosOrdenados
        }`;
        
        const ordenes = await sanityClientServer.fetch(query);
        return NextResponse.json(ordenes); 

    } catch (err) {
        console.error('Error GET /api/ordenes:', err);
        return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
    }
}

// Handler para POST: Guardar o Actualizar una orden
export async function POST(req) {
    try {
        const body = await req.json();
        const { mesa, mesero, platosOrdenados, ordenId } = body;

        // Preparamos los platos con su _key para Sanity
        const platosConKey = platosOrdenados.map(p => ({
            ...p,
            _key: p._key || crypto.randomUUID(),
            _type: 'platoOrdenado' 
        }));

        const datosOrden = {
            _type: 'ordenActiva',
            mesa: mesa || 'Mesa Sin Nombre',
            mesero: mesero || 'Mesero',
            platosOrdenados: platosConKey,
            fechaCreacion: new Date().toISOString(),
        };

        let resultado;

        if (ordenId) {
            // ACTUALIZAR ORDEN EXISTENTE
            resultado = await sanityClientServer
                .patch(ordenId)
                .set(datosOrden)
                .commit();
        } else {
            // CREAR NUEVA ORDEN
            resultado = await sanityClientServer.create(datosOrden);
        }

        // Devolvemos el objeto real para que el alert NO diga "undefined"
        return NextResponse.json(resultado, { status: 201 });

    } catch (err) {
        console.error('Error POST /api/ordenes:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}