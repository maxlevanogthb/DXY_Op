package com.dxyop.controller;

import com.dxyop.model.ConfiguracionGeneral;
import com.dxyop.repository.ConfiguracionGeneralRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/configuracion")
@RequiredArgsConstructor
public class ConfiguracionGeneralController {

    private final ConfiguracionGeneralRepository repository;

    @GetMapping
    public ResponseEntity<ConfiguracionGeneral> get() {
        // Si no existe, lo crea con valores por defecto
        ConfiguracionGeneral config = repository.findById(1L).orElseGet(() -> {
            ConfiguracionGeneral c = new ConfiguracionGeneral();
            c.setId(1L);
            c.setNombreComercial("Óptica DXY");
            c.setHoraApertura(LocalTime.of(9, 0));
            c.setHoraCierre(LocalTime.of(19, 0));
            c.setDuracionCitaMinutos(60);
            c.setPorcentajeImpuesto(16.0);
            return repository.save(c);
        });
        return ResponseEntity.ok(config);
    }

    @PostMapping
    public ResponseEntity<ConfiguracionGeneral> save(@RequestBody ConfiguracionGeneral config) {
        config.setId(1L); // Nos aseguramos de que siempre actualice el ID 1
        return ResponseEntity.ok(repository.save(config));
    }
}