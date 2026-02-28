package com.dxyop.repository;

import com.dxyop.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    
    List<Cliente> findByNombreContainingIgnoreCase(String nombre);
    
    List<Cliente> findByTelefonoContaining(String telefono);
    
    @Query("SELECT c FROM Cliente c WHERE c.activo = true ORDER BY c.fechaRegistro DESC")
    List<Cliente> findAllActivos();
}

