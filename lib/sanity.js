// Archivo: talanquera-frontend/lib/sanity.js

import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url'; // <-- Agregamos esta importación

const commonConfig = {
    projectId: 'ot7gcgs1',
    dataset: 'production',
    apiVersion: '2024-08-01', 
};

// CLIENTE PÚBLICO (Lectura de menú)
export const sanityClientPublic = createClient({
    ...commonConfig,
    useCdn: false,
});

// CLIENTE SERVIDOR (Escritura de ventas)
export const sanityClientServer = createClient({
    ...commonConfig,
    useCdn: false, 
    token: process.env.SANITY_WRITE_TOKEN, 
    ignoreBrowserTokenWarning: true,
});

export const client = sanityClientPublic; 

// --- CONFIGURACIÓN PARA IMÁGENES ---
const builder = imageUrlBuilder(client);

export function urlFor(source) {
    return builder.image(source);
}