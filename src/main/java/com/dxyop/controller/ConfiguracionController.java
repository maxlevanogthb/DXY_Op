package com.dxyop.controller;

import com.dxyop.model.TipoProducto;
import com.dxyop.service.TipoProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Controller
@RequestMapping("/admin/config")
@RequiredArgsConstructor
public class ConfiguracionController {
    
    private final TipoProductoService tipoService;
    
     @GetMapping  // GET /admin/config
    public String index() {
        return "admin/configuracion";
    }
    
    // ⭐ API Tipos (mantiene compatibilidad)
    @GetMapping("/api/tipos-producto")
    @ResponseBody
    public List<TipoProducto> getTipos() {
        return tipoService.getAllActivos();
    }
    
    @PostMapping("/api/tipos-producto")
    @ResponseBody
    public TipoProducto saveTipo(@RequestBody TipoProducto tipo) {
        return tipoService.save(tipo);
    }
    
    @DeleteMapping("/api/tipos-producto/{id}")
    @ResponseBody
    public void deleteTipo(@PathVariable Long id) {
        tipoService.delete(id);
    }
    
    @GetMapping("/api/tipos-producto/{id}")
    @ResponseBody
    public TipoProducto getTipo(@PathVariable Long id) {
        return tipoService.getById(id);
    }
    
    // ⭐ FUTURO: Otras configs
    @GetMapping("/razones")
    public String razones() {
        return "admin/configuracion-razones";  // Próximo HTML
    }
}
