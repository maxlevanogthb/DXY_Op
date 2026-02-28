package com.dxyop.service;

import com.dxyop.model.ClientePotencial;
import com.dxyop.model.EstadoClientePotencial;
import com.dxyop.repository.ClientePotencialRepository;

import io.micrometer.common.lang.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClientePotencialService {

    private final ClientePotencialRepository repository;

    // Lista todos los potenciales (orden fecha)
    public List<ClientePotencial> getAll() {
        return repository.findAllByOrderByFechaRegistroDesc();
    }

    // Solo pendientes (más importantes para ofta)
    public List<ClientePotencial> getPendientes() {
        return repository.findByEstadoOrderByFechaRegistroDesc(EstadoClientePotencial.PENDIENTE);
    }

    // Buscar por teléfono/nombre
    public List<ClientePotencial> search(String termino) {
        return repository.findByNombreContainingIgnoreCaseOrTelefonoContainingIgnoreCase(termino, termino);
    }

    // Guardar nuevo/editar
    public @NonNull ClientePotencial save(@NonNull ClientePotencial potencial) {
        return repository.save(potencial);
    }

    // Cambiar estado (PENDIENTE → CONTACTADO → ATENDIDO)
    public ClientePotencial cambiarEstado(Long id, EstadoClientePotencial estado) {
        ClientePotencial potencial = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Cliente potencial no encontrado"));
        potencial.setEstado(estado);
        return repository.save(potencial);
    }

    // Eliminar lógico (estado = ELIMINADO)
    public void delete(Long id) {
        ClientePotencial potencial = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Cliente potencial no encontrado"));
        potencial.setEstado(EstadoClientePotencial.ELIMINADO);  // o tabla separados
        repository.save(potencial);
    }

    // Contar por estado (dashboard)
    public long contarPendientes() {
        return repository.countByEstado(EstadoClientePotencial.PENDIENTE);
    }

    public long contarContactados() {
        return repository.countByEstado(EstadoClientePotencial.CONTACTADO);
    }

     public Optional<ClientePotencial> findById(Long id) {
        return repository.findById(id);
    }
}
