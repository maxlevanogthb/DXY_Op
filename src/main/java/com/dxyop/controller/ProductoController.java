package com.dxyop.controller;

import com.dxyop.model.Producto;
import com.dxyop.repository.ProductoRepository;
import com.dxyop.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductoController {

    private final ProductoService service;
    private final ProductoRepository repository;

    // 1. Obtener todos
    @GetMapping
    public List<Producto> getAll() {
        return service.getAllActivos();
    }

    // 2. Obtener uno por ID (FALTABA ESTE, necesario para editar)
    @GetMapping("/{id}")
    public ResponseEntity<Producto> getById(@PathVariable Long id) {
        Producto prod = service.getById(id);
        if (prod == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(prod);
    }

    // 3. Filtrar por nombre de tipo (ej: /api/productos/tipo/armazon)
    @GetMapping("/tipo/{tipoNombre}")
    public List<Producto> getByTipo(@PathVariable String tipoNombre) {
        return service.getByTipo(tipoNombre);
    }

    // 4. Guardar / Editar
    @PostMapping
    public Producto create(@RequestBody Producto producto) {
        return service.save(producto);
    }

    @PutMapping("/{id}")
    public Producto update(@PathVariable Long id, @RequestBody Producto producto) {
        producto.setId(id); // Asegurar que sea update
        return service.save(producto);
    }

    // 5. Eliminar (Desactivar)
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    //Obtener Marcas (ej: /api/productos/buscar/marcas?tipo=Armazon)
    @GetMapping("/buscar/marcas")
    public List<String> getMarcas(@RequestParam String tipo) {
        return repository.findMarcasByTipo(tipo);
    }

    //Obtener Modelos (ej: /api/productos/buscar/modelos?marca=LV)
    @GetMapping("/buscar/modelos")
    public List<String> getModelos(@RequestParam String marca) {
        return repository.findModelosByMarca(marca);
    }

    //Obtener Colores
    @GetMapping("/buscar/colores")
    public List<String> getColores(@RequestParam String marca, @RequestParam String modelo) {
        return repository.findColoresByModelo(marca, modelo);
    }

    //Obtener Tallas
    @GetMapping("/buscar/tallas")
    public List<String> getTallas(@RequestParam String marca, @RequestParam String modelo, @RequestParam String color) {
        return repository.findTallasByColor(marca, modelo, color);
    }

    //Obtener el producto final (con precio y stock)
    @GetMapping("/buscar/final")
    public ResponseEntity<Producto> getProductoFinal(
            @RequestParam String marca, 
            @RequestParam String modelo, 
            @RequestParam String color, 
            @RequestParam String talla) {
        
        Producto p = repository.findByMarcaAndModeloAndColorAndTallaAndActivoTrue(marca, modelo, color, talla);
        return p != null ? ResponseEntity.ok(p) : ResponseEntity.notFound().build();
    }
}