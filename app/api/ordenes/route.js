// Archivo: talanquera-frontend/app/api/ordenes/route.js

import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';

// Handler para GET (Obtener TODAS las órdenes activas)
export async function GET(request) {
    try {
        // Consulta GROQ: Trae la lista de todas las órdenes activas
        const query = `*[_type == "ordenActiva"] {
            _id,
            mesa,
            fechaCreacion
            // ... otros campos que necesites para la lista
        }`;
        
        const ordenes = await sanityClientServer.fetch(query);

        // Importante: Debe devolver un JSON, incluso si la lista está vacía (cuerpo: [])
        return NextResponse.json(ordenes); 

    } catch (err) {
        console.error('Error al obtener la lista de órdenes:', err);
        return NextResponse.json(
            { error: 'Error al obtener las órdenes.' },
            { status: 500 }
        );
    }
}
// Puedes agregar la función POST aquí si se usa para crear nuevas órdenes.