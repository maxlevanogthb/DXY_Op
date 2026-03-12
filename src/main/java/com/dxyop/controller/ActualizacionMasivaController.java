package com.dxyop.controller;

import com.dxyop.model.Producto;
import com.dxyop.model.OpcionLente;
import com.dxyop.model.ConfiguracionGeneral;
import com.dxyop.service.ProductoService;
import com.dxyop.service.OpcionLenteService;
import com.dxyop.service.ConfiguracionGeneralService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.math.BigDecimal;

@RestController
@RequiredArgsConstructor
public class ActualizacionMasivaController {

    private final ProductoService productoService;
    private final OpcionLenteService opcionLenteService;
    private final ConfiguracionGeneralService configService; // ⭐ Lo inyectamos aquí

    @PostMapping("/api/configuracion/aplicar-comision-masiva")
    public ResponseEntity<?> aplicarComisionMasiva() {
        try {
            // ⭐ 1. AHORA SÍ TRAEMOS LA COMISIÓN REAL DESDE TU BASE DE DATOS ⭐
            ConfiguracionGeneral config = configService.obtenerConfiguracion();
            Double comisionGlobal = (config != null && config.getPorcentajeComisionTarjeta() != null) 
                                    ? config.getPorcentajeComisionTarjeta() 
                                    : 0.0;

            // 2. ACTUALIZAR PRODUCTOS
            List<Producto> productos = productoService.getAllActivos(); 
            for (Producto p : productos) {
                if (p.getPrecioCosto() == null || p.getPrecioCosto() <= 0) {
                    p.setPrecioCosto(p.getPrecio().doubleValue()); 
                    p.setPorcentajeComision(comisionGlobal);
                    Double nuevoPrecio = p.getPrecioCosto() * (1 + (comisionGlobal / 100));
                    p.setPrecio(BigDecimal.valueOf(nuevoPrecio)); 
                }
            }
            productoService.saveAll(productos); 

            // 3. ACTUALIZAR CATÁLOGOS CLÍNICOS
            List<OpcionLente> opciones = opcionLenteService.getAllOpciones(); 
            for (OpcionLente o : opciones) {
                if (o.getPrecioCosto() == null || o.getPrecioCosto() <= 0) {
                    o.setPrecioCosto(o.getPrecioBase().doubleValue()); 
                    o.setPorcentajeComision(comisionGlobal);
                    Double nuevoPrecio = o.getPrecioCosto() * (1 + (comisionGlobal / 100));
                    o.setPrecioBase(BigDecimal.valueOf(nuevoPrecio));
                }
            }
            opcionLenteService.saveAll(opciones);

            return ResponseEntity.ok().body("{\"mensaje\": \"Catálogo actualizado correctamente\"}");
            
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.badRequest().body("{\"error\": \"Error interno: " + e.getMessage() + "\"}");
        }
    }
}