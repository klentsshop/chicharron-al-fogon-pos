// Archivo: talanquera-frontend/lib/utils.js

// Función para limpiar y formatear precios antes de mostrarlos o sumarlos
export const formatPrecioDisplay = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor && valor !== 0) return 0;
    const cleaned = String(valor)
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\s/g, '')
        .replace(/\$/g, '')
        .replace(/\./g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
};

// Mapa de iconos y nombres de categorías
export const categoriasMap = {
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
};

// Constante de métodos de pago
export const METODOS_PAGO = [
    { title: 'Efectivo', value: 'efectivo' },
    { title: 'Nequi/Daviplata', value: 'digital' },
    { title: 'Tarjeta', value: 'tarjeta' }
];