import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';
import { crypto } from 'crypto'; // Aseguramos disponibilidad de randomUUID

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * LISTAR ÓRDENES ACTIVAS
 * Modificado para traer los platos y que el cajero vea el contenido
 */
export async function GET() {
    try {
        const query = `*[_type == "ordenActiva"] | order(fechaCreacion asc) {
            _id,
            mesa,
            mesero,
            fechaCreacion,
            platosOrdenados // ✅ CRÍTICO: Si no traemos esto, el cajero ve la mesa pero no los platos
        }`;

        const data = await sanityClientServer.fetch(query);
        
        return NextResponse.json(data || []); 
    } catch (error) {
        console.error('[API_LIST_GET_ERROR]:', error);
        return NextResponse.json([], { status: 200 });
    }
}

/**
 * CREAR O ACTUALIZAR ORDEN
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { mesa, mesero, platosOrdenados, ordenId } = body;

        if (!mesa || !Array.isArray(platosOrdenados) || platosOrdenados.length === 0) {
            return NextResponse.json(
                { error: 'Datos incompletos para crear/actualizar la orden.' },
                { status: 400 }
            );
        }

        const platosNormalizados = platosOrdenados.map(p => {
            const cantidad = Number(p.cantidad) || 1;
            const precio = Number(p.precioUnitario || p.precioNum) || 0; // ✅ Soporte para ambos nombres de propiedad

            return {
                _key: p._key || Math.random().toString(36).substring(2, 9), // Generador de llave seguro si no existe
                nombrePlato: p.nombrePlato || p.nombre, // ✅ Mapeo de nombre
                cantidad,
                precioUnitario: precio,
                subtotal: precio * cantidad,
                comentario: p.comentario || ""
            };
        });

        // ACTUALIZAR EXISTENTE
        if (ordenId) {
            const updated = await sanityClientServer
                .patch(ordenId)
                .set({
                    mesa,
                    mesero,
                    platosOrdenados: platosNormalizados,
                    fechaCreacion: new Date().toISOString()
                })
                .commit();

            return NextResponse.json({
                message: 'Orden actualizada correctamente',
                ordenId: updated._id,
                mesa: updated.mesa,
                mesero: updated.mesero
            });
        }

        // CREAR NUEVA
        const nuevaOrden = {
            _type: 'ordenActiva',
            mesa,
            mesero,
            fechaCreacion: new Date().toISOString(),
            platosOrdenados: platosNormalizados
        };

        const created = await sanityClientServer.create(nuevaOrden);

        return NextResponse.json(
            {
                message: 'Orden creada correctamente',
                ordenId: created._id,
                mesa: created.mesa,
                mesero: created.mesero
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('[API_LIST_POST_ERROR]:', error);
        return NextResponse.json(
            { error: 'Error al procesar orden en Sanity' },
            { status: 500 }
        );
    }
}