package com.dxyop.controller;

import com.dxyop.dto.PagoDto;
import com.dxyop.model.Pago;
import com.dxyop.repository.PagoRepository;
import com.dxyop.service.PagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;
    private final PagoRepository pagoRepository;

    // Registrar un nuevo abono
    @PostMapping
    public ResponseEntity<Pago> crearPago(@RequestBody PagoDto dto) {
        try {
            Pago nuevoPago = pagoService.registrarPago(dto);
            return ResponseEntity.ok(nuevoPago);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // Obtener ventas de HOY (para el corte de caja)
    @GetMapping("/hoy")
    public ResponseEntity<List<Pago>> getVentasHoy() {
        return ResponseEntity.ok(pagoService.obtenerVentasDelDia());
    }

    @GetMapping("/consulta/{consultaId}")
    public ResponseEntity<List<Pago>> getHistorialPorConsulta(@PathVariable Long consultaId) {
        try {
            // Usamos el repositorio que ya configuramos para buscar por ID y ordenar por fecha (el más reciente primero)
            List<Pago> historial = pagoRepository.findByConsultaIdOrderByFechaPagoDesc(consultaId);
            
            if (historial.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            
            return ResponseEntity.ok(historial);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}