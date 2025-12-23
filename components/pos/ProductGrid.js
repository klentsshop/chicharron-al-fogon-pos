import React from 'react';
import { formatPrecioDisplay, categoriasMap } from '@/lib/utils';
import { urlFor } from '@/lib/sanity';

export default function ProductGrid({
    platos, platosFiltrados, categoriaActiva, setCategoriaActiva,
    mostrarCategoriasMobile, setMostrarCategoriasMobile, agregarAlCarrito, 
    styles, mostrarCarritoMobile, setMostrarCarritoMobile 
}) {
    const listaCategorias = ['todos', ...new Set(platos.map(p => p.categoria))];

    return (
        <div className={styles.menuPanel}>
            {/* BOTONES DE NAVEGACIÓN SUPERIOR (MÓVIL) */}
            {!mostrarCarritoMobile && (
                <>
                    {/* CARRITO A LA IZQUIERDA */}
                    <button 
                        className={styles.mobileOrderBtn} 
                        onClick={(e) => {
                            e.stopPropagation();
                            setMostrarCarritoMobile(true);
                        }}
                    >
                        🛒
                    </button>

                    {/* HAMBURGUESA / X A LA DERECHA */}
                    <button 
                        className={styles.mobileCatBtn} 
                        onClick={(e) => {
                            e.stopPropagation();
                            setMostrarCategoriasMobile(!mostrarCategoriasMobile);
                        }}
                    >
                        {mostrarCategoriasMobile ? '✕' : '☰'}
                    </button>
                </>
            )}

            {/* Menú lateral de categorías */}
            <div className={`${styles.categoriesBar} ${mostrarCategoriasMobile ? styles.categoriesBarShowMobile : ''}`}>
                <h3 className={styles.mobileOnlyTitle}>Categorías</h3>
                {listaCategorias.map(cat => (
                    <button 
                        key={cat} 
                        className={`${styles.catBtn} ${categoriaActiva === cat ? styles.catBtnActive : ''}`} 
                        onClick={() => {
                            setCategoriaActiva(cat);
                            setMostrarCategoriasMobile(false);
                        }}>
                        {categoriasMap[cat] || cat}
                    </button>
                ))}
            </div>

            {/* Cuadrícula de Platos con Diseño Split */}
            <div className={styles.productsGrid}>
                {platosFiltrados.map(plato => (
                    <div key={plato._id} className={styles.productCard} onClick={() => agregarAlCarrito(plato)}>
                        {/* 1. Área de Imagen: Sin sombras que opaquen la comida */}
                        <div 
                            className={styles.cardImage} 
                            style={{ 
                                backgroundImage: plato.imagen 
                                    ? `url(${urlFor(plato.imagen).width(300).url()})` 
                                    : 'none',
                                backgroundColor: '#f3f4f6'
                            }}
                        />
                        
                        {/* 2. Área de Información: Texto claro sobre fondo blanco */}
                        <div className={styles.cardInfo}>
                            <div className={styles.cardTitle}>{plato.nombre}</div>
                            <div className={styles.cardPrice}>
                                ${formatPrecioDisplay(plato.precio).toLocaleString('es-CO')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}