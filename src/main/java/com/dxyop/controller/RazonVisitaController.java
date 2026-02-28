package com.dxyop.controller;

import java.util.List;
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

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}