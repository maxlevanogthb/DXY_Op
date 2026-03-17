package com.dxyop.service;

import com.dxyop.model.Paciente;
import com.dxyop.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PacienteService {

    private final PacienteRepository repository;

    public List<Paciente> getAllPacientes() {
        List<Paciente> pacientes = repository.findAllActivos();
        pacientes.forEach(p -> p.setConsultas(null));
        return pacientes;
    }

    public Paciente getPacienteById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Paciente savePaciente(Paciente paciente) {
        return repository.save(paciente);
    }

    public void deletePaciente(Long id) {
        Paciente paciente = getPacienteById(id);
        if (paciente != null) {
            paciente.setActivo(false); 
            repository.save(paciente);
        }
    }

    public List<Paciente> searchPacientes(String nombre) {
        return repository.findByNombreContainingIgnoreCase(nombre);
    }

    // Para el módulo de Pacientes
    public List<Paciente> getPacientesOficiales() {
        List<Paciente> pacientes = repository.findAllOficialesActivos();
        pacientes.forEach(p -> p.setConsultas(null));
        return pacientes;
    }

    // Para el módulo de Clientes Potenciales
    public List<Paciente> getProspectos() {
        List<Paciente> prospectos = repository.findAllProspectosActivos();
        prospectos.forEach(p -> p.setConsultas(null));
        return prospectos;
    }

}