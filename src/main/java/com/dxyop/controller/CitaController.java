package com.dxyop.controller;

import com.dxyop.model.Cita;
import com.dxyop.model.RazonVisita;
import com.dxyop.service.CitaService;
import com.dxyop.service.RazonVisitaService; // <--- NUEVO
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
public class CitaController {

    private final CitaService service;
    private final RazonVisitaService razonService; // <--- Inyectamos tu servicio de razones

    // 1. OBTENER CITAS PARA FULLCALENDAR (AHORA CON COLORES DINÁMICOS)
    @GetMapping
    public List<Map<String, Object>> getCitas(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        List<Cita> citas = service.getCitasEnRango(start, end);
        
        // --- LA MAGIA: Creamos un diccionario de Motivo -> Color ---
        List<RazonVisita> razones = razonService.getAllActivos();
        Map<String, String> mapaColores = new HashMap<>();
        for (RazonVisita r : razones) {
            // Si por alguna razón no tiene color, le ponemos el azul de Bootstrap por defecto
            String color = (r.getColorHex() != null && !r.getColorHex().isEmpty()) ? r.getColorHex() : "#0d6efd";
            mapaColores.put(r.getNombre(), color);
        }
        // -----------------------------------------------------------

        List<Map<String, Object>> eventos = new ArrayList<>();

        for (Cita c : citas) {
            Map<String, Object> evento = new HashMap<>();
            evento.put("id", c.getId());
            
            String nombreMostrado = c.getCliente() != null ? c.getCliente().getNombre() : c.getNombreTemporal();
            evento.put("title", c.getTipo() + " - " + nombreMostrado);
            
            evento.put("start", c.getInicio().toString());
            evento.put("end", c.getFin().toString());

            // --- ASIGNACIÓN DINÁMICA DE COLOR ---
            // Buscamos el tipo de cita en nuestro diccionario. Si no existe (ej. lo borraron), usamos gris.
            String colorDinamico = mapaColores.getOrDefault(c.getTipo(), "#6c757d");
            evento.put("backgroundColor", colorDinamico);
            evento.put("borderColor", colorDinamico);

            // Propiedades extendidas
            Map<String, Object> extra = new HashMap<>();
            extra.put("estado", c.getEstado());
            extra.put("telefono", c.getCliente() != null ? c.getCliente().getTelefono() : c.getTelefonoTemporal());
            extra.put("notas", c.getNotas());
            extra.put("pacienteId", c.getCliente() != null ? c.getCliente().getId() : null);
            extra.put("nombrePaciente", nombreMostrado);
            extra.put("tipo", c.getTipo());
            
            evento.put("extendedProps", extra);
            eventos.add(evento);
        }

        return eventos;
    }

    // 2. GUARDAR / CREAR CITA
    @PostMapping
    public ResponseEntity<Cita> createCita(@RequestBody Cita cita) {
        return ResponseEntity.ok(service.save(cita));
    }

    // 3. ACTUALIZAR CITA
    @PutMapping("/{id}")
    public ResponseEntity<Cita> updateCita(@PathVariable Long id, @RequestBody Cita cita) {
        cita.setId(id);
        return ResponseEntity.ok(service.save(cita));
    }

    // 4. ELIMINAR CITA
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCita(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}