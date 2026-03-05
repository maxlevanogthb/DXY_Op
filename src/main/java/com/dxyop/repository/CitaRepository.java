package com.dxyop.repository;

import com.dxyop.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {

    // Otros métodos que ya tenías...
    List<Cita> findByInicioBetween(LocalDateTime start, LocalDateTime end);

    // ==========================================
    // ¡CORREGIDO! Cambiamos ClienteId por PacienteId
    // ==========================================
    List<Cita> findByPacienteIdOrderByInicioDesc(Long id); 
}