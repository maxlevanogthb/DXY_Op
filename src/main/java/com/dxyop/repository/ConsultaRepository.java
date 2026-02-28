package com.dxyop.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.dxyop.model.Consulta;

@Repository
public interface ConsultaRepository extends JpaRepository<Consulta, Long> {
    List<Consulta> findByClienteIdOrderByFechaVisitaDesc(Long clienteId);

    // 2. REPORTE DE VENTAS POR FECHA (Nuevo)
    // Útil para: "¿Cuántas consultas hubo hoy?" o "Corte de caja del mes"
    List<Consulta> findByFechaVisitaBetween(LocalDate fechaInicio, LocalDate fechaFin);

    // 3. COBRANZA / DEUDORES (Nuevo)
    // Útil para: "Múestrame todos los que deben dinero (restante > 0)"
    List<Consulta> findByRestanteGreaterThan(Double monto);

    // Buscar todas las consultas donde se debe dinero (restante mayor a 0.1 para
    // evitar errores de decimales)
    @EntityGraph(attributePaths = {"cliente", "pagos"})
    List<Consulta> findByRestanteGreaterThanOrderByFechaVisitaDesc(Double montoMinimo);

    // 2. Para la pestaña "Ventas Finalizadas/Cobradas" (Deuda <= $0.50)
    @EntityGraph(attributePaths = {"cliente", "pagos"})
    List<Consulta> findByRestanteLessThanEqualOrderByFechaVisitaDesc(Double montoMinimo);

    // --- QUERYS PARA EL DASHBOARD ---
    @Query("SELECT SUM(c.restante) FROM Consulta c WHERE c.restante > 0")
    Double sumarCuentasPorCobrar();

    @Query("SELECT COUNT(c) FROM Consulta c WHERE c.fechaVisita >= :inicio AND c.fechaVisita <= :fin")
    Long contarConsultasPorRango(java.time.LocalDate inicio, java.time.LocalDate fin);

    @Query("SELECT COUNT(c) FROM Consulta c WHERE c.estadoEntrega = 'PENDIENTE'")
    Long contarTrabajosPendientes();

    // Query para la gráfica de dona (Agrupa los subtotales del carrito por tipo de producto)
    @Query("SELECT d.tipoItem, SUM(d.subtotal) FROM Consulta c JOIN c.detalles d WHERE c.fechaVisita >= :inicioMes GROUP BY d.tipoItem")
    List<Object[]> sumarVentasPorCategoria(java.time.LocalDate inicioMes);

    // Buscar los 5 pacientes que más deben (Restante > 0)
    List<Consulta> findTop5ByRestanteGreaterThanOrderByRestanteDesc(Double restante);

}
