package com.dxyop.controller;

import com.dxyop.model.ClientePotencial;
import com.dxyop.model.EstadoClientePotencial;
import com.dxyop.service.ClientePotencialService;
import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/potenciales")
@RequiredArgsConstructor
public class ClientePotencialController {

    private final ClientePotencialService service;

    @GetMapping("/{id}")
    public ClientePotencial getById(@PathVariable Long id) {
        return service.findById(id).orElse(null);
    }

    @GetMapping
    public List<ClientePotencial> getAll() {
        return service.getAll();
    }

    @GetMapping("/pendientes")
    public List<ClientePotencial> getPendientes() {
        return service.getPendientes();
    }

    @PostMapping
    public ClientePotencial save(@RequestBody ClientePotencial potencial) {
        return service.save(potencial);
    }

    @PutMapping("/{id}/estado/{estado}")
    public ClientePotencial cambiarEstado(@PathVariable Long id,
            @PathVariable EstadoClientePotencial estado) {
        return service.cambiarEstado(id, estado);
    }

    
}
