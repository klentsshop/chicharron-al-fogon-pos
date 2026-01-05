import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';

// Forzamos que no haya caché para que el total de gastos siempre sea real
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        // Solo extraemos lo que realmente vamos a usar según tu petición de simplicidad
        const { descripcion, monto } = body;

        // Validación inicial
        if (!descripcion || monto === undefined || monto === null || monto === '') {
            return NextResponse.json(
                { error: 'Descripción y monto son obligatorios' }, 
                { status: 400 }
            );
        }

        // 🔥 LIMPIEZA DE PUNTOS Y COMAS:
        // 1. Convertimos a texto por seguridad
        // 2. Quitamos puntos de miles
        // 3. Cambiamos la coma por punto decimal para que parseFloat lo entienda
        const montoLimpio = monto.toString().replace(/\./g, '').replace(',', '.');
        const montoNumerico = parseFloat(montoLimpio);

        // Verificamos que el resultado sea un número real
        if (isNaN(montoNumerico)) {
            return NextResponse.json(
                { error: 'El monto ingresado no es un número válido' }, 
                { status: 400 }
            );
        }

        const nuevoGasto = {
            _type: 'gasto',
            descripcion: descripcion,
            monto: montoNumerico, // ✅ Ahora 2.000 o 2,000 se guarda como 2000
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