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
        name: "Chicharrón al Fogón",
        shortName: "Chicharrón al Fogón",
        nit: "123.456.789-0",
        address: "Cll. 191 #8b-05, Bohotá",
        phone: "3103086336",
        mensajeTicket: "¡Gracias por su compra!",
        currency: "es-CO",
        symbol: "$",
    },

    // 🎨 PALETA RÚSTICA: Chicharrón al Fogón

theme: {
    primary: "#10B981",    // ✅ Verde Esmeralda (Cobrar - Igual a la barra inferior)
    secondary: "#166534",  // Verde Bosque (Imprimir / Identidad logo)
    accent: "#F59E0B",     // ✅ Naranja Ámbar (Gastos - Más claro y equilibrado)
    danger: "#EF4444",     // Rojo (Alertas)
    dark: "#166534",       // ✅ Cambiamos el gris carbón por el VERDE BOSQUE del logo para la cabecera
    background: "#F3F4F6", 
    textLight: "#FFFFFF",  // ✅ Blanco para que resalte sobre el verde oscuro
    textDark: "#1F2937",   
},

    // 🏷️ CATEGORÍAS PERSONALIZABLES (Tus 12 categorías originales)
    categorias: {
        todos: '🏠 TODO',
        carta: '🥩 Carta',
        picadas: '🥘 Picadas',
        bebidas: '🥤 Bebidas',
        sopas: '🍲 Sopas',
        desayunos: '☕ Desayuno',
        diario: '🍛 Diario',
        Porciones: '🥟 Porciones',
        Tipicos: '🍱 tipicos',
        Adiciones: '🍟 Adiciones',
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