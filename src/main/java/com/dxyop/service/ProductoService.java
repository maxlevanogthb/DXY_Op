package com.dxyop.service;

import com.dxyop.model.Producto;
import com.dxyop.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository repository;

    public List<Producto> getAllActivos() {
        return repository.findByActivoTrue();
    }

    public Producto getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public List<Producto> getByTipo(String tipoNombre) {
        return repository.findByTipoNombreAndActivoTrue(tipoNombre);
    }

    public Producto save(Producto producto) {
        return repository.save(producto);
    }

    public void delete(Long id) {
        repository.findById(id).ifPresent(p -> {
            p.setActivo(false);
            repository.save(p);
        });
    }

    public void saveAll(List<Producto> productos) {
        repository.saveAll(productos);
    }
}