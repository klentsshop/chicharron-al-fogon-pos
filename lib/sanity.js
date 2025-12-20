// Archivo: talanquera-frontend/lib/sanity.js

import { createClient } from 'next-sanity';

const commonConfig = {
    projectId: 'ot7gcgs1',
    dataset: 'production',
    apiVersion: '2024-08-01', // Usamos la versión más reciente
};

// CLIENTE PÚBLICO (Lectura de menú - Se usa en CartLogic.jsx)
export const sanityClientPublic = createClient({
    ...commonConfig,
    useCdn: true,
});

// CLIENTE SERVIDOR (Escritura de ventas - Se usa en app/api/ventas/route.js)
export const sanityClientServer = createClient({
    ...commonConfig,
    useCdn: false, 
    token: process.env.SANITY_WRITE_TOKEN, // ¡SIN NEXT_PUBLIC!
    ignoreBrowserTokenWarning: true,
});

export const client = sanityClientPublic; // Mantenemos 'client' para no romper la lectura actual