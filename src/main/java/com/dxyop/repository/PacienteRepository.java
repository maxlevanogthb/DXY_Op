package com.dxyop.repository;

import com.dxyop.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    
    List<Paciente> findByNombreContainingIgnoreCase(String nombre);
    
    List<Paciente> findByTelefonoContaining(String telefono);
    
    @Query("SELECT p FROM Paciente p WHERE p.activo = true") 
    List<Paciente> findAllActivos();
}

