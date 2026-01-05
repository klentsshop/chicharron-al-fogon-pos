import { useState } from 'react';
import { client } from '@/lib/sanity';

export function useReportes(getFechaBogota) {
    const [mostrarReporte, setMostrarReporte] = useState(false);
    const [datosReporte, setDatosReporte] = useState({
        ventas: 0,
        totalPropinas: 0,
        gastos: 0,
        productos: {}
    });
    const [cargandoReporte, setCargandoReporte] = useState(false);
    const [fechaInicioReporte, setFechaInicioReporte] = useState(getFechaBogota());
    const [fechaFinReporte, setFechaFinReporte] = useState(getFechaBogota());
    const [listaGastosDetallada, setListaGastosDetallada] = useState([]);

    const [mostrarAdmin, setMostrarAdmin] = useState(false);
    const [reporteAdmin, setReporteAdmin] = useState({
        ventasTotales: 0,
        porMesero: {},
        gastos: 0,
        estadisticas: {
            metodosPago: { efectivo: 0, tarjeta: 0, transferencia: 0 },
            topPlatos: [],
            totalPropinas: 0
        }
    });
    const [cargandoAdmin, setCargandoAdmin] = useState(false);
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState(getFechaBogota());
    const [fechaFinFiltro, setFechaFinFiltro] = useState(getFechaBogota());
    const [pinMemoria, setPinMemoria] = useState(null);

    // =========================
    // 📊 CIERRE DE DÍA (CAJA)
    // =========================
    const generarCierreDia = async () => {
        setCargandoReporte(true);
        setMostrarReporte(true);
        try {
            const inicio = `${fechaInicioReporte}T00:00:00Z`;
            const fin = `${fechaFinReporte}T23:59:59Z`;

            const queryVentas = `
                *[_type == "venta" &&
                (fecha >= $inicio && fecha <= $fin ||
                 _createdAt >= $inicio && _createdAt <= $fin)]{
                    "totalPagado": coalesce(totalPagado, 0),
                    "propinaRecaudada": coalesce(propinaRecaudada, 0),
                    platosVendidosV2
                }
            `;

            const [ventas, gastos] = await Promise.all([
                client.fetch(queryVentas, { inicio, fin }, { useCdn: false }),
                client.fetch(
                    `*[_type == "gasto" && fecha >= $inicio && fecha <= $fin]{
                        "monto": coalesce(monto, 0),
                        descripcion
                    }`,
                    { inicio, fin },
                    { useCdn: false }
                )
            ]);

            let totalVentasNetas = 0;
            let totalPropinas = 0;
            let productos = {};

            ventas.forEach(v => {
                const venta = Number(v.totalPagado || 0);
                const propina = Number(v.propinaRecaudada || 0);

                totalVentasNetas += venta;
                totalPropinas += propina;

                v.platosVendidosV2?.forEach(p => {
                    const nombre = p.nombrePlato || "Desconocido";
                    productos[nombre] =
                        (productos[nombre] || 0) + Number(p.cantidad || 0);
                });
            });

            const totalGastos = gastos.reduce(
                (acc, g) => acc + Number(g.monto || 0),
                0
            );

            setDatosReporte({
                ventas: totalVentasNetas,
                totalPropinas,
                gastos: totalGastos,
                productos
            });

            setListaGastosDetallada(gastos);
        } catch (error) {
            console.error("🔥 Error crítico en cierre:", error);
            alert("Error al generar cierre de día.");
        } finally {
            setCargandoReporte(false);
        }
    };

    // =========================
    // 🔐 REPORTE ADMINISTRATIVO
    // =========================
    const cargarReporteAdmin = async (pinRecibido = null) => {
        let pinFinal =
            typeof pinRecibido === 'string' ? pinRecibido : pinMemoria;

        if (!pinFinal) pinFinal = prompt("🔑 Ingrese PIN administrativo");
        if (!pinFinal) return;

        setCargandoAdmin(true);
        try {
            const res = await fetch('/api/admin/reportes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fechaInicio: `${fechaInicioFiltro}T00:00:00Z`,
                    fechaFin: `${fechaFinFiltro}T23:59:59Z`,
                    pinAdmin: pinFinal
                })
            });

            const data = await res.json();

            let ventasTotales = 0;
            let porMesero = {};

            (data.ventas || []).forEach(v => {
                const monto = Number(v.totalPagado || 0);
                ventasTotales += monto;

                const nombre = v.mesero || "General";
                porMesero[nombre] = (porMesero[nombre] || 0) + monto;
            });

            const totalGastos = (data.gastos || []).reduce(
                (acc, g) => acc + Number(g.monto || 0),
                0
            );

            setPinMemoria(pinFinal);
            setReporteAdmin({
                ventasTotales,
                porMesero,
                gastos: totalGastos,
                estadisticas: data.estadisticas || {
                    metodosPago: { efectivo: 0, tarjeta: 0, transferencia: 0 },
                    topPlatos: [],
                    totalPropinas: 0
                }
            });

            setMostrarAdmin(true);
        } catch (error) {
            console.error("🔥 Error admin:", error);
            alert("Error al cargar reporte administrativo.");
        } finally {
            setCargandoAdmin(false);
        }
    };

    return {
        mostrarReporte,
        setMostrarReporte,
        datosReporte,
        cargandoReporte,
        fechaInicioReporte,
        setFechaInicioReporte,
        fechaFinReporte,
        setFechaFinReporte,
        listaGastosDetallada,
        generarCierreDia,
        mostrarAdmin,
        setMostrarAdmin,
        reporteAdmin,
        cargandoAdmin,
        fechaInicioFiltro,
        setFechaInicioFiltro,
        fechaFinFiltro,
        setFechaFinFiltro,
        cargarReporteAdmin
    };
}
