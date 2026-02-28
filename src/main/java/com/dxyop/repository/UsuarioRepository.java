package com.dxyop.repository;

import com.dxyop.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Para buscar al usuario cuando intente hacer Login
    Optional<Usuario> findByUsername(String username);
    
    // Para mostrar en la tabla solo los que no han sido eliminados
    List<Usuario> findByActivoTrue();
}