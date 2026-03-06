package com.dxyop.controller;

import com.dxyop.model.Cita;
import com.dxyop.model.Paciente;
import com.dxyop.model.RazonVisita;
import com.dxyop.service.CitaService;
import com.dxyop.service.RazonVisitaService;
import com.dxyop.service.PacienteService; // <--- NUEVO: Lo necesitamos para guardar al prospecto
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
    private final PacienteService pacienteService; // <--- Inyectamos el servicio

    // 1. OBTENER CITAS PARA FULLCALENDAR
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
            
            // --- CÓDIGO LIMPIO: Ya no hay temporales ---
            // Como ahora TODA cita tiene un paciente obligatorio:
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
            extra.put("telefono", c.getPaciente().getTelefono()); // Directo del paciente
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

    // 2. GUARDAR / CREAR CITA (¡LA MAGIA DEL MINI-CRM!)
    @PostMapping
    public ResponseEntity<Cita> createCita(@RequestBody Cita cita) {
        
        // REGLA DE ORO: Si el paciente viene sin ID, es una persona nueva.
        if (cita.getPaciente() != null && cita.getPaciente().getId() == null) {
            
            // Extraemos los datos que mandó la recepcionista
            Paciente nuevoLead = cita.getPaciente();
            
            // Lo marcamos como Prospecto (Lead)
            nuevoLead.setEsPacienteOficial(false); 
            
            // Lo guardamos en la base de datos de Pacientes
            Paciente leadGuardado = pacienteService.savePaciente(nuevoLead);
            
            // Le asignamos el paciente ya guardado (con su nuevo ID) a la cita
            cita.setPaciente(leadGuardado);
        }
        
        // Guardamos la cita normalmente
        return ResponseEntity.ok(service.save(cita));
    }

    // 3. ACTUALIZAR CITA
    @PutMapping("/{id}")
    public ResponseEntity<Cita> updateCita(@PathVariable Long id, @RequestBody Cita cita) {
        cita.setId(id);
        
        // Si al actualizar editaron el nombre de alguien nuevo, aplicamos la misma lógica
        if (cita.getPaciente() != null && cita.getPaciente().getId() == null) {
            Paciente nuevoLead = cita.getPaciente();
            nuevoLead.setEsPacienteOficial(false);
            Paciente leadGuardado = pacienteService.savePaciente(nuevoLead);
            cita.setPaciente(leadGuardado);
        }

        return ResponseEntity.ok(service.save(cita));
    }

    // 4. ELIMINAR CITA
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCita(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}