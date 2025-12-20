import { NextResponse } from 'next/server';
import { client, sanityClientServer } from '@/lib/sanity';

// 🛡️ Blindaje contra caché: Fuerza a Next.js a buscar siempre datos frescos
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * LISTAR ÓRDENES ACTIVAS
 */
export async function GET() {
    try {
        const query = `*[_type == "ordenActiva"] | order(fechaCreacion asc) {
            _id,
            mesa,
            mesero,
            fechaCreacion
        }`; // 🆕 Agregamos 'mesero' a la consulta para que el modal lo muestre

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
        const { mesa, mesero, platosOrdenados, ordenId } = body; // 🆕 Recibimos 'mesero'

        if (!mesa || !Array.isArray(platosOrdenados) || platosOrdenados.length === 0) {
            return NextResponse.json(
                { error: 'Datos incompletos para crear/actualizar la orden.' },
                { status: 400 }
            );
        }

        const platosNormalizados = platosOrdenados.map(p => {
            const cantidad = Number(p.cantidad) || 1;
            const precio = Number(p.precioUnitario) || 0;

            return {
                _key: crypto.randomUUID(),
                nombrePlato: p.nombrePlato,
                cantidad,
                precioUnitario: precio,
                subtotal: precio * cantidad
            };
        });

        // ACTUALIZAR EXISTENTE
        if (ordenId) {
            const updated = await sanityClientServer
                .patch(ordenId)
                .set({
                    mesa,
                    mesero, // 🆕 Actualizamos o mantenemos el mesero
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
            mesero, // 🆕 Guardamos el mesero en la creación
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