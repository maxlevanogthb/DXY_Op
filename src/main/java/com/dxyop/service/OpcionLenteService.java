package com.dxyop.service;

import java.util.List;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.dxyop.model.OpcionLente;
import com.dxyop.repository.OpcionLenteRepository;

@Service
@RequiredArgsConstructor
public class OpcionLenteService {

    private final OpcionLenteRepository repository;

    public List<OpcionLente> getByCategoria(String categoria) {
        return repository.findByCategoriaOrderByPrecioBaseAsc(categoria);
    }

    public OpcionLente save(OpcionLente opcion) {
        return repository.save(opcion);
    }

    public OpcionLente getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<OpcionLente> getAllOpciones() {
        return repository.findAll();
    }

    public void saveAll(List<OpcionLente> opciones) {
        repository.saveAll(opciones);
    }
}