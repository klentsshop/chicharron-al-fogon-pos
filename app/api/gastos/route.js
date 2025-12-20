import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';

// Forzamos que no haya caché para que el total de gastos siempre sea real
export const dynamic = 'force-dynamic';


export async function POST(request) {
    try {
        const body = await request.json();
        // Solo extraemos lo que realmente vamos a usar según tu petición de simplicidad
        const { descripcion, monto } = body;

        if (!descripcion || !monto) {
            return NextResponse.json(
                { error: 'Descripción y monto son obligatorios' }, 
                { status: 400 }
            );
        }

        const nuevoGasto = {
            _type: 'gasto',
            descripcion: descripcion,
            monto: Number(monto),
            fecha: new Date().toISOString() // Fecha automática del sistema
        };

        const created = await sanityClientServer.create(nuevoGasto);

        return NextResponse.json({ 
            ok: true, 
            message: 'Gasto registrado correctamente',
            id: created._id 
        }, { status: 201 });

    } catch (error) {
        console.error('[API_GASTOS_ERROR]:', error);
        return NextResponse.json(
            { error: 'Error interno al registrar el gasto' }, 
            { status: 500 }
        );
    }
}