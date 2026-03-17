package com.dxyop.controller;

import com.dxyop.model.Cita;
import com.dxyop.model.Paciente;
import com.dxyop.model.RazonVisita;
import com.dxyop.service.CitaService;
import com.dxyop.service.RazonVisitaService;
import com.dxyop.service.PacienteService; 
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
    private final RazonVisitaService razonService;
    private final PacienteService pacienteService; 

    // OBTENER CITAS PARA FULLCALENDAR
    @GetMapping
    public List<Map<String, Object>> getCitas(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        List<Cita> citas = service.getCitasEnRango(start, end);
        
        // Diccionario de Motivo -> Color
        List<RazonVisita> razones = razonService.getAllActivos();
        Map<String, String> mapaColores = new HashMap<>();
        for (RazonVisita r : razones) {
            String color = (r.getColorHex() != null && !r.getColorHex().isEmpty()) ? r.getColorHex() : "#0d6efd";
            mapaColores.put(r.getNombre(), color);
        }

        List<Map<String, Object>> eventos = new ArrayList<>();

        for (Cita c : citas) {
            Map<String, Object> evento = new HashMap<>();
            evento.put("id", c.getId());
            
            String nombreMostrado = c.getPaciente().getNombre();
            
            evento.put("title", c.getTipo() + " - " + nombreMostrado);
            evento.put("start", c.getInicio().toString());
            evento.put("end", c.getFin().toString());

            // Color
            String colorDinamico = mapaColores.getOrDefault(c.getTipo(), "#6c757d");
            evento.put("backgroundColor", colorDinamico);
            evento.put("borderColor", colorDinamico);

            // Propiedades extendidas para el Modal del Frontend
            Map<String, Object> extra = new HashMap<>();
            extra.put("estado", c.getEstado());
            extra.put("telefono", c.getPaciente().getTelefono());
            extra.put("notas", c.getNotas());
            extra.put("pacienteId", c.getPaciente().getId());
            extra.put("nombrePaciente", nombreMostrado);
            extra.put("tipo", c.getTipo());

            extra.put("esPacienteOficial", c.getPaciente().isEsPacienteOficial());
            
            evento.put("extendedProps", extra);
            eventos.add(evento);
        }

        return eventos;
    }

    // 2. GUARDAR / CREAR CITA 
    @PostMapping
    public ResponseEntity<Cita> createCita(@RequestBody Cita cita) {
        
        if (cita.getPaciente() != null && cita.getPaciente().getId() == null) {
            
            Paciente nuevoLead = cita.getPaciente();
            
            nuevoLead.setEsPacienteOficial(false); 
            
            Paciente leadGuardado = pacienteService.savePaciente(nuevoLead);
            
            cita.setPaciente(leadGuardado);
        }
        
        return ResponseEntity.ok(service.save(cita));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cita> updateCita(@PathVariable Long id, @RequestBody Cita cita) {
        cita.setId(id);
        
        if (cita.getPaciente() != null && cita.getPaciente().getId() == null) {
            Paciente nuevoLead = cita.getPaciente();
            nuevoLead.setEsPacienteOficial(false);
            Paciente leadGuardado = pacienteService.savePaciente(nuevoLead);
            cita.setPaciente(leadGuardado);
        }

        return ResponseEntity.ok(service.save(cita));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCita(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}