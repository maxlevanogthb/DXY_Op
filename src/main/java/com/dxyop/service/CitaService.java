package com.dxyop.service;

import com.dxyop.model.Cita;
import com.dxyop.repository.CitaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CitaService {

    private final CitaRepository repository;

    public List<Cita> getCitasEnRango(LocalDateTime inicio, LocalDateTime fin) {
        return repository.findByInicioBetween(inicio, fin);
    }

    public Cita getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Cita save(Cita cita) {
        // Aseguramos que siempre tenga una fecha de fin (si no la mandan, sumamos 30 mins)
        if (cita.getFin() == null && cita.getInicio() != null) {
            cita.setFin(cita.getInicio().plusMinutes(30));
        }
        return repository.save(cita);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}