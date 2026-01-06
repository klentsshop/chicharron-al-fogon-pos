import { NextResponse } from 'next/server';
import { sanityClientServer } from '@/lib/sanity';

// 🚀 CRÍTICO: Evita que Next.js cachee el borrado
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const ordenId = body.ordenId;

    if (!ordenId) {
      return NextResponse.json(
        { error: 'ordenId requerido' },
        { status: 400 }
      );
    }

    // 🛡️ Usamos commit() para asegurar que la transacción se complete
    // Sanity delete es asíncrono, pero con esto esperamos la confirmación
    await sanityClientServer
      .delete(ordenId)
      .then(() => console.log(`Mesa ${ordenId} borrada de Sanity`));

    return NextResponse.json({ 
        message: 'Orden eliminada correctamente',
        success: true 
    });
    
  } catch (error) {
    // Si Sanity no encuentra el ID, lanzará un error. Lo manejamos:
    const errorMessage = error.message || "";
    
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return NextResponse.json({ 
          message: 'La orden ya no existía en el servidor', 
          success: true 
        });
    }

    console.error('[API_DELETE_ERROR]:', error);
    return NextResponse.json(
      { error: 'Error interno al eliminar la orden', details: errorMessage },
      { status: 500 }
    );
  }
}