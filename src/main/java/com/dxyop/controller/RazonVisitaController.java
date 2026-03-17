package com.dxyop.controller;

import java.util.List;
import org.springframework.http.ResponseEntity; // ⭐ Importación necesaria
import org.springframework.web.bind.annotation.*;
import com.dxyop.model.RazonVisita;
import com.dxyop.service.RazonVisitaService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/razones-visita")
@RequiredArgsConstructor
public class RazonVisitaController {
    
    private final RazonVisitaService service;

    @GetMapping
    public List<RazonVisita> getAll() {
        return service.getAllActivos();
    }

    @PostMapping
    public RazonVisita save(@RequestBody RazonVisita razon) {
        return service.save(razon);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RazonVisita> getById(@PathVariable Long id) {
        RazonVisita razon = service.getById(id);
        if (razon != null) {
            return ResponseEntity.ok(razon);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<RazonVisita> update(@PathVariable Long id, @RequestBody RazonVisita razonActualizada) {
        RazonVisita razonExistente = service.getById(id);
        
        if (razonExistente == null) {
            return ResponseEntity.notFound().build();
        }
        
        razonExistente.setNombre(razonActualizada.getNombre());
        razonExistente.setCategoria(razonActualizada.getCategoria());
        razonExistente.setColorHex(razonActualizada.getColorHex());
        
        return ResponseEntity.ok(service.save(razonExistente));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}