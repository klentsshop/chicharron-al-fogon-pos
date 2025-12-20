// Archivo: talanquera-frontend/app/ClientWrapper.jsx
'use client'; 

import React from 'react';
import MenuPanel from './MenuPanel'; // IMPORTAMOS EL NOMBRE NUEVO

export default function ClientWrapper() {
  // Asegúrate de que el componente que contiene el POS sea el que se renderiza aquí
  return <MenuPanel />; 
}