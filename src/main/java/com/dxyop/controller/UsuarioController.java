package com.dxyop.controller;

import com.dxyop.model.Usuario;
import com.dxyop.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder; // <--- NUEVO
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder; // <--- INYECTAMOS EL ENCRIPTADOR

    @GetMapping
    public List<Usuario> getAll() {
        return repository.findByActivoTrue();
    }

    @PostMapping
    public ResponseEntity<Usuario> create(@RequestBody Usuario usuario) {
        // Encriptamos la contraseña antes de guardarla en la Base de Datos
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return ResponseEntity.ok(repository.save(usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Usuario u = repository.findById(id).orElseThrow();
        u.setActivo(false);
        repository.save(u);
        return ResponseEntity.ok().build();
    }
}