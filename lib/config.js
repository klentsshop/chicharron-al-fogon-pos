// lib/config.js
export const SYSTEM = {
    name: "Pedidos Pro POS",
    version: "1.0.0",
    buildDate: "2026-01-04",
    developer: "Klentsshop"
};
export const SITE_CONFIG = {
    // 👤 IDENTIDAD DEL NEGOCIO
    brand: {
        name: "ASADERO LA TALANQUERA",
        shortName: "La Talanquera",
        nit: "123.456.789-0",
        address: "Cra. 6 #26A - 27, Fusagasugá",
        phone: "300 000 0000",
        mensajeTicket: "¡Gracias por su compra!",
        currency: "es-CO",
        symbol: "$",
    },

    // 🎨 PALETA DE COLORES (SaaS Ready)
    theme: {
        primary: "#10B981",    // Verde (Cajeros, Cobrar, Éxito)
        secondary: "#3B82F6",  // Azul (Imprimir Cliente, Info)
        accent: "#F59E0B",     // Naranja (Gastos, Advertencias)
        danger: "#EF4444",     // Rojo (Reportes, Borrar)
        dark: "#1F2937",       // Gris Oscuro (Cabeceras, Cocina)
        textLight: "#FFFFFF",
        textDark: "#4B5563",
    },

    // 🏷️ CATEGORÍAS PERSONALIZABLES (Tus 12 categorías originales)
    categorias: {
        todos: '🏠 TODO',
        carnes: '🥩 Carnes',
        pescados: '🐟 Pescados',
        bebidas: '🥤 Bebidas',
        sopas: '🍲 Sopas',
        infantil: '👶 Infantil',
        desayunos: '☕ Desayuno',
        diario: '🍛 Diario',
        entradas: '🥟 Entradas',
        nocturno: '🌙 Nocturno',
        porciones: '🍟 Porciones',
        otros: '⚙️ Otros'
    },

    // 💳 MÉTODOS DE PAGO
    metodosPago: [
        { title: '💵 Efectivo', value: 'efectivo' },
        { title: '📱 Digital', value: 'digital' },
        { title: '💳 Tarjeta', value: 'tarjeta' }
    ],

    // ⚙️ LÓGICA DE OPERACIÓN
    logic: {
        timezone: 'America/Bogota',
        // Categoría que siempre va al final del ticket
        drinkCategory: "bebidas",
        // Palabras que disparan prioridad alta en cocina
        priorityKeywords: ["almuerzo", "especial", "corriente", "sopa"],
        // PIN por defecto si no hay en Sanity
        defaultAdminPin: "1234",
    }
};