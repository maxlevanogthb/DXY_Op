package com.dxyop.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dxyop.model.TipoProducto;
import com.dxyop.service.TipoProductoService;

import lombok.RequiredArgsConstructor;

@RestController  
@RequestMapping("/api")
@RequiredArgsConstructor
public class TipoProductoController {
    private final TipoProductoService service;
    
    @GetMapping("/tipos-producto")
    public List<TipoProducto> getAll() {
        return service.getAllActivos();
    }
    
    @GetMapping("/tipos-producto/{id}")
    public TipoProducto getById(@PathVariable Long id) {
        return service.getById(id);
    }
    
    @PostMapping("/tipos-producto")
    public TipoProducto save(@RequestBody TipoProducto tipo) {
        return service.save(tipo);
    }
    
    @DeleteMapping("/tipos-producto/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PutMapping("/tipos-producto/{id}")
    public ResponseEntity<TipoProducto> actualizarTipoProducto(@PathVariable Long id, @RequestBody TipoProducto detallesActualizados) {
        
        TipoProducto tipoExistente = service.getById(id);
        
        if (tipoExistente != null) {
            
            tipoExistente.setNombre(detallesActualizados.getNombre());
            tipoExistente.setDescripcion(detallesActualizados.getDescripcion());
            tipoExistente.setIcono(detallesActualizados.getIcono());
            
            TipoProducto tipoGuardado = service.save(tipoExistente);
            
            return ResponseEntity.ok(tipoGuardado);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}

