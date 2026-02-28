package com.dxyop.repository;

import com.dxyop.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    long countByConsultaId(Long consultaId);
    
    // Para reportes: Buscar pagos entre dos fechas
    List<Pago> findByFechaPagoBetweenOrderByFechaPagoDesc(LocalDateTime inicio, LocalDateTime fin);

    // Ver historial de pagos de una consulta específica
    List<Pago> findByConsultaIdOrderByFechaPagoDesc(Long consultaId);
    
    // Sumar cuánto dinero entró hoy (Query nativo opcional para dashboard rápido)
    @Query("SELECT SUM(p.monto) FROM Pago p WHERE p.fechaPago BETWEEN :inicio AND :fin")
    Double sumarVentasPorRango(LocalDateTime inicio, LocalDateTime fin);

    
}