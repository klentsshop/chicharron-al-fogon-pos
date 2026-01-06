"use client";

import { useEffect, useState } from 'react';
import { client } from '@/lib/sanity';
import { useParams, useSearchParams } from 'next/navigation';
import { PrintTemplates } from '@/components/pos/PrintTemplates';

export default function TicketDetalle() {
    const params = useParams();
    const searchParams = useSearchParams();

    const [orden, setOrden] = useState(null);
    const [cargando, setCargando] = useState(true);

    // cliente | cocina
    const tipoTicket = searchParams.get('type') || 'cliente';
    
    // ✅ NUEVA LÓGICA: Capturamos la lista de IDs que deben ignorarse (los que ya se imprimieron)
    const ignorarIdsRaw = searchParams.get('ignorar') || "";
    const listaIgnorar = ignorarIdsRaw ? ignorarIdsRaw.split(',') : [];

    useEffect(() => {
        if (!params.id) return;

        // 🧠 Lógica de re-intento: Sanity a veces tarda en propagar el nuevo ID
        const fetchOrden = async (intentos = 0) => {
            try {
                const data = await client.fetch(
                    `*[_id == $id][0]`,
                    { id: params.id },
                    { useCdn: false } // Forzamos consulta directa a la API
                );

                if (!data && intentos < 3) {
                    // Si no lo encuentra, espera 800ms y reintenta
                    setTimeout(() => fetchOrden(intentos + 1), 800);
                } else {
                    setOrden(data);
                    setCargando(false);
                }
            } catch (err) {
                console.error("Error cargando orden:", err);
                setCargando(false);
            }
        };

        fetchOrden();
    }, [params.id]);

    if (cargando) return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ Generando ticket...</div>;
    if (!orden) return <div style={{ padding: '20px', textAlign: 'center' }}>❌ Ticket no encontrado o borrado</div>;

    // 🔥 LÓGICA DE FILTRADO INFALIBLE POR ID
    const obtenerItemsFiltrados = () => {
        const todosLosPlatos = orden.platosVendidosV2 || orden.platosOrdenados || [];
        
        // Si es cocina y traemos lista de ignorados, filtramos
        if (tipoTicket === 'cocina' && listaIgnorar.length > 0) {
            return todosLosPlatos.filter(plato => {
                const idActual = plato._key || plato.lineId;
                // Si el ID del plato está en la lista de ignorar, lo quitamos
                return !listaIgnorar.includes(idActual);
            });
        }
        
        return todosLosPlatos;
    };

    const itemsAMostrar = obtenerItemsFiltrados();
    const esAdicionReal = tipoTicket === 'cocina' && listaIgnorar.length > 0;

    return (
        <div className={`ticket-page-container view-${tipoTicket}`}>
            <PrintTemplates
                /** DATOS GENERALES */
                total={orden.totalPagado || 0}
                ordenMesa={orden.mesa}
                nombreMesero={orden.mesero}
                propina={orden.propinaRecaudada || 0}

                /** DATOS DE ÍTEMS FILTRADOS */
                agrupadoCliente={tipoTicket === 'cliente' ? itemsAMostrar : []}
                agrupadoCocina={tipoTicket === 'cocina' ? itemsAMostrar : []}

                /** CONTROL REAL */
                esSoloCocina={tipoTicket === 'cocina'}
                ordenActivaId={null}   // 🔥 CLAVE: Para que PrintTemplates sepa que es vista final
            />

            <button
                onClick={() => window.print()}
                className="btn-flotante-print print:hidden"
            >
                🖨️ Imprimir {tipoTicket === 'cocina' ? (esAdicionReal ? 'ADICIÓN' : 'Comanda') : 'Ticket'}
            </button>
        </div>
    );
}