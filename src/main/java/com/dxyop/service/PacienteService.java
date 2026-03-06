package com.dxyop.service;

import com.dxyop.model.Paciente;
// ¡Adiós import com.dxyop.model.ClientePotencial!
import com.dxyop.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PacienteService {

    private final PacienteRepository repository;

    // 1. Renombramos el método y las variables internas
    public List<Paciente> getAllPacientes() {
        List<Paciente> pacientes = repository.findAllActivos();
        // Null listas
        pacientes.forEach(p -> p.setConsultas(null));
        return pacientes;
    }

    // 2. Renombramos a getPacienteById
    public Paciente getPacienteById(Long id) {
        return repository.findById(id).orElse(null);
    }

    // 3. Renombramos a savePaciente
    public Paciente savePaciente(Paciente paciente) {
        return repository.save(paciente);
    }

    // 4. Renombramos a deletePaciente
    public void deletePaciente(Long id) {
        Paciente paciente = getPacienteById(id);
        if (paciente != null) {
            paciente.setActivo(false); // Soft delete, ¡excelente práctica!
            repository.save(paciente);
        }
    }

    // 5. Renombramos a searchPacientes
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