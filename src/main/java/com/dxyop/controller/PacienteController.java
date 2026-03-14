package com.dxyop.controller;

import com.dxyop.dto.PacienteDto;
import com.dxyop.model.Paciente;
import com.dxyop.service.PacienteService; 
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pacientes") 
@RequiredArgsConstructor
@CrossOrigin(origins = "*") 
public class PacienteController {

    // Renombramos el servicio
    private final PacienteService service; 

    // Para el autocompletado del Calendario (Busca entre TODOS)
    @GetMapping
    public List<PacienteDto> getAll() {
        return service.getAllPacientes().stream()
                .map(this::convertirADto) // Usamos un método auxiliar para no repetir código
                .collect(Collectors.toList());
    }

    // Para tu tabla del Módulo de Pacientes
    @GetMapping("/oficiales")
    public List<PacienteDto> getOficiales() {
        return service.getPacientesOficiales().stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    // Para tu tabla del Módulo de Clientes Potenciales
    @GetMapping("/prospectos")
    public List<PacienteDto> getProspectos() {
        return service.getProspectos().stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    // MÉTODO AUXILIAR
    private PacienteDto convertirADto(Paciente paciente) {
        PacienteDto dto = new PacienteDto();
        dto.setId(paciente.getId());
        dto.setNombre(paciente.getNombre());
        dto.setTelefono(paciente.getTelefono());
        dto.setEmail(paciente.getEmail());
        dto.setFechaRegistro(paciente.getFechaRegistro());
        dto.setEdad(paciente.getEdad());
        dto.setMotivo(paciente.getMotivo());
        dto.setGraduacionActual(paciente.getGraduacionActual());
        dto.setEsPacienteOficial(paciente.isEsPacienteOficial());
        return dto;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Paciente> getById(@PathVariable Long id) {
        Paciente paciente = service.getPacienteById(id);
        return paciente != null ? ResponseEntity.ok(paciente) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public Paciente create(@RequestBody Paciente paciente) {
        //paciente.setEsPacienteOficial(true); 
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

    // ==========================================
    // Convertir Lead a Paciente
    // ==========================================
    @PatchMapping("/{id}/convertir")
    public ResponseEntity<Paciente> convertirAPacienteOficial(@PathVariable Long id) {
        Paciente paciente = service.getPacienteById(id);
        if (paciente == null) {
            return ResponseEntity.notFound().build();
        }
        
        // ¡Se hizo la magia! Pasa a ser paciente oficial
        paciente.setEsPacienteOficial(true);
        
        return ResponseEntity.ok(service.savePaciente(paciente));
    }
}