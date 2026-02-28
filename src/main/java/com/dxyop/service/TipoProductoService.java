package com.dxyop.service;

import com.dxyop.model.TipoProducto;
import com.dxyop.repository.TipoProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoProductoService {
    private final TipoProductoRepository repository;
    
    public List<TipoProducto> getAllActivos() {
        return repository.findByActivoTrueOrderByNombre();
    }
    
    public TipoProducto save(TipoProducto tipo) {
        return repository.save(tipo);
    }
    
    public TipoProducto getById(Long id) {
        return repository.findById(id).orElse(null);
    }
    
    public void delete(Long id) {
        TipoProducto tipo = getById(id);
        if (tipo != null) tipo.setActivo(false);
        save(tipo);
    }
}
