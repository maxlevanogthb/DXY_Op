package com.dxyop.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.dxyop.model.OpcionLente;
import com.dxyop.service.OpcionLenteService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/opciones-lente") // Nueva URL específica
@RequiredArgsConstructor
public class OpcionLenteController {

    private final OpcionLenteService service;

    // Endpoint: /api/opciones-lente?categoria=MATERIAL
    @GetMapping
    public List<OpcionLente> getByCategoria(@RequestParam String categoria) {
        return service.getByCategoria(categoria);
    }
    
    // Endpoint para guardar nuevas opciones desde Postman o Configuración
    @PostMapping
    public OpcionLente create(@RequestBody OpcionLente opcion) {
        return service.save(opcion);
    }
}