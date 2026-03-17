package com.dxyop.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dxyop.model.OpcionLente;
import com.dxyop.model.Producto;
import com.dxyop.repository.OpcionLenteRepository;
import com.dxyop.repository.ProductoRepository;

@RestController
@RequestMapping("/api/catalogo")
public class CatalogoController {

@Autowired
    private OpcionLenteRepository opcionRepository;
    
    @Autowired
    private ProductoRepository productoRepository;

    /**
     * Endpoint 1: Obtener listas para Lentes/Micas
     * Uso: /api/catalogo/lentes?categoria=MATERIAL
     * Uso: /api/catalogo/lentes?categoria=TRATAMIENTO
     */
    @GetMapping("/lentes")
    public List<OpcionLente> getOpcionesLente(@RequestParam String categoria) {
        // Devuelve la lista ordenada por precio
        return opcionRepository.findByCategoriaOrderByPrecioBaseAsc(categoria);
    }

    /**
     * Endpoint 2: Obtener Armazones disponibles por Tipo
     * Uso: /api/catalogo/armazones?tipo=Ranurado
     */
    @GetMapping("/armazones")
    public List<Producto> getArmazonesPorTipo(@RequestParam String tipo) {
        // Buscamos productos que coincidan con el tipo y tengan al menos 1 en stock
        return productoRepository.findBySubTipoAndStockGreaterThan(tipo, 0);
    }
    
    @PostMapping("/opcion")
    public OpcionLente guardarOpcion(@RequestBody OpcionLente opcion) {
        return opcionRepository.save(opcion);
    }

    @DeleteMapping("/opcion/{id}")
    public void eliminarOpcion(@PathVariable Long id) {
        opcionRepository.deleteById(id);
    }
}