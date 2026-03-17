package com.dxyop.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.dxyop.model.OpcionLente;
import com.dxyop.service.OpcionLenteService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/opciones-lente")
@RequiredArgsConstructor
public class OpcionLenteController {

    private final OpcionLenteService service;

    @GetMapping
    public List<OpcionLente> getByCategoria(@RequestParam String categoria) {
        return service.getByCategoria(categoria);
    }
    
    @PostMapping
    public OpcionLente create(@RequestBody OpcionLente opcion) {
        return service.save(opcion);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OpcionLente> getById(@PathVariable Long id) {
        OpcionLente opcion = service.getById(id);
        if(opcion != null) return ResponseEntity.ok(opcion);
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<OpcionLente> update(@PathVariable Long id, @RequestBody OpcionLente actualizacion) {
        OpcionLente existente = service.getById(id);
        if (existente == null) return ResponseEntity.notFound().build();
        
        existente.setNombre(actualizacion.getNombre());
        existente.setPrecioBase(actualizacion.getPrecioBase());
        
        return ResponseEntity.ok(service.save(existente));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}