import "./globals.css";
// Mantenemos tu CartProvider intacto
import { CartProvider } from './context/CartContext'; 

export const metadata = {
  title: "POS - Asadero La Talanquera",
  description: "Sistema de ventas para el Asadero La Talanquera",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      {/* Quitamos las clases de Geist y usamos la clase antialiased estándar */}
      <body className="antialiased">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}