package com.dxyop.service;

import java.util.List;
import org.springframework.stereotype.Service;
import com.dxyop.model.RazonVisita;
import com.dxyop.repository.RazonVisitaRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RazonVisitaService {
    private final RazonVisitaRepository repository;

    public List<RazonVisita> getAllActivos() {
        return repository.findByActivoTrueOrderByNombreAsc();
    }

    public RazonVisita save(RazonVisita razon) {
        return repository.save(razon);
    }

    public void delete(Long id) {
        RazonVisita r = repository.findById(id).orElse(null);
        if(r != null) {
            r.setActivo(false); // Borrado lógico
            repository.save(r);
        }
    }
}