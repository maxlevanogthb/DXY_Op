package com.dxyop.repository;

import com.dxyop.model.ClientePotencial;
import com.dxyop.model.EstadoClientePotencial;  
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClientePotencialRepository extends JpaRepository<ClientePotencial, Long> {
    List<ClientePotencial> findByEstadoOrderByFechaRegistroDesc(EstadoClientePotencial estado);
    List<ClientePotencial> findByNombreContainingIgnoreCaseOrTelefonoContainingIgnoreCase(String nombre, String telefono);
    long countByEstado(EstadoClientePotencial estado);
    List<ClientePotencial> findAllByOrderByFechaRegistroDesc();
    
}


