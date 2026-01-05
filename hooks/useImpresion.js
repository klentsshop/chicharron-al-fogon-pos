// app/hooks/useImpresion.js
export function useImpresion(cart, config) {

    const imprimirCliente = () => {
        if (!cart || cart.length === 0) return;

        document.body.classList.remove('imprimiendo-cocina');
        document.body.classList.add('imprimiendo-cliente');

        setTimeout(() => { 
            window.print(); 
            document.body.classList.remove('imprimiendo-cliente'); 
        }, 500); 
    };

    const imprimirCocina = () => {
        if (!cart || cart.length === 0) return;

        document.body.classList.remove('imprimiendo-cliente');
        document.body.classList.add('imprimiendo-cocina');

        setTimeout(() => { 
            window.print(); 
            document.body.classList.remove('imprimiendo-cocina');
        }, 500);
    };

    // 👤 CLIENTE → Agrupa TODO sin comentarios
    const agruparParaCliente = () => {
        const agrupados = cart.reduce((acc, item) => {
            const key = `${item.nombre}-${item.precioNum || 0}`;

            if (!acc[key]) {
                acc[key] = { 
                    nombre: item.nombre,
                    cantidad: 0,
                    subtotal: 0
                };
            }

            acc[key].cantidad += item.cantidad;
            acc[key].subtotal += (item.precioNum * item.cantidad);
            return acc;
        }, {});

        return Object.values(agrupados);
    };

    // 👨‍🍳 COCINA → Agrupa por comentario + ORDENA (bebidas al final)
    const agruparParaCocina = () => {
        const agrupados = cart.reduce((acc, item) => {
            const notaKey = item.comentario
                ? item.comentario.trim().toLowerCase()
                : 'sin-nota';

            const key = `${item.nombre}-${item.precioNum || 0}-${notaKey}`;

            if (!acc[key]) {
                acc[key] = { 
                    nombre: item.nombre,
                    categoria: item.categoria,
                    cantidad: 0,
                    comentario: item.comentario
                };
            }

            acc[key].cantidad += item.cantidad;
            return acc;
        }, {});

        const lista = Object.values(agrupados);

        // 🔥 ORDEN PROFESIONAL DE COCINA
        const bebidaSlug = (config?.categoriaBebidas || '').toLowerCase();
        const prioridad = (config?.palabraPrioridadCocina || '').toLowerCase();

        return lista.sort((a, b) => {
            const catA = (a.categoria || '').toLowerCase();
            const catB = (b.categoria || '').toLowerCase();

            // 1️⃣ Bebidas SIEMPRE al final
            if (catA === bebidaSlug && catB !== bebidaSlug) return 1;
            if (catA !== bebidaSlug && catB === bebidaSlug) return -1;

            // 2️⃣ Prioridad (ej: almuerzo)
            const esA = a.nombre.toLowerCase().includes(prioridad);
            const esB = b.nombre.toLowerCase().includes(prioridad);
            if (esA && !esB) return -1;
            if (!esA && esB) return 1;

            return a.nombre.localeCompare(b.nombre);
        });
    };

    return { 
        imprimirCliente,
        imprimirCocina,
        agruparParaCliente,
        agruparParaCocina
    };
}
