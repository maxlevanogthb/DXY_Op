package com.dxyop.repository;

import com.dxyop.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {
    
    // Busca las citas en un rango de fechas (usado por FullCalendar)
    List<Cita> findByInicioBetween(LocalDateTime inicio, LocalDateTime fin);
    
    // (Opcional) Por si algún día quieres ver todas las citas de un paciente
    List<Cita> findByClienteIdOrderByInicioDesc(Long clienteId);
}