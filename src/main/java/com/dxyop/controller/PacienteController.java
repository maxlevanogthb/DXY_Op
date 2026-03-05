package com.dxyop.controller;

import com.dxyop.dto.PacienteDto;
import com.dxyop.model.Paciente;
import com.dxyop.service.PacienteService; // <-- Asegúrate de renombrar también tu ClienteService
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pacientes") // <-- ¡OJO! Tu endpoint ahora es "pacientes"
@RequiredArgsConstructor
@CrossOrigin(origins = "*") 
public class PacienteController {

    // Renombramos el servicio
    private final PacienteService service; 

    @GetMapping
    public List<PacienteDto> getAll() {
        return service.getAllPacientes().stream() // Asegúrate de renombrar el método en tu servicio
                .map(paciente -> {
                    PacienteDto dto = new PacienteDto();
                    
                    dto.setId(paciente.getId());
                    dto.setNombre(paciente.getNombre());
                    dto.setTelefono(paciente.getTelefono());
                    dto.setEmail(paciente.getEmail());
                    
                    dto.setFechaRegistro(paciente.getFechaRegistro());
                    dto.setFechaNacimiento(paciente.getFechaNacimiento());
                    dto.setMotivo(paciente.getMotivo());
                    dto.setGraduacionActual(paciente.getGraduacionActual());
                    
                    // ⭐ AQUÍ MAPEAMOS LA NUEVA BANDERA DEL MINI-CRM ⭐
                    dto.setEsPacienteOficial(paciente.isEsPacienteOficial());
                    
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Paciente> getById(@PathVariable Long id) {
        Paciente paciente = service.getPacienteById(id);
        return paciente != null ? ResponseEntity.ok(paciente) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public Paciente create(@RequestBody Paciente paciente) {
        // Al crear desde aquí (módulo pacientes), asumimos que sí es oficial
        paciente.setEsPacienteOficial(true); 
        return service.savePaciente(paciente);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Paciente> update(@PathVariable Long id, @RequestBody Paciente paciente) {
        paciente.setId(id);
        Paciente updated = service.savePaciente(paciente);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deletePaciente(id);
        return ResponseEntity.ok().build();
    }
}