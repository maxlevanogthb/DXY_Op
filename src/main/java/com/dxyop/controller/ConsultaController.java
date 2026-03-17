package com.dxyop.controller;

import java.io.ByteArrayOutputStream;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.dxyop.dto.ConsultaDto;
//import com.dxyop.model.Paciente;
import com.dxyop.model.Consulta;
//import com.dxyop.model.Producto;
import com.dxyop.repository.ConsultaRepository;
import com.dxyop.service.ConsultaService;
import com.dxyop.service.PdfService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/consultas")
@RequiredArgsConstructor 
public class ConsultaController {

    private final ConsultaService service;
    private final ConsultaRepository consultaRepository;
    private final ConsultaService consultaService;
    private final PdfService pdfService;

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Consulta>> getHistorialPorCliente(@PathVariable Long clienteId) {
        List<Consulta> historial = service.getHistorialCliente(clienteId);
        if (historial.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(historial);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Consulta> getById(@PathVariable Long id) {
        Consulta consulta = service.getById(id);
        if (consulta == null) {
            return ResponseEntity.notFound().build();
        }
        
        if(consulta.getDetalles() != null) {
            consulta.getDetalles().size(); 
        }
        if(consulta.getPagos() != null) {
            consulta.getPagos().size();
        }
        
        return ResponseEntity.ok(consulta);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ConsultaDto dto) {
        try {
            dto.setId(null); 
            
            Consulta guardada = service.guardarConsulta(dto);
            
            return ResponseEntity.ok(guardada);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error guardando consulta: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ConsultaDto dto) {
        try {
            dto.setId(id);
            
            Consulta actualizada = service.guardarConsulta(dto);
            
            return ResponseEntity.ok(actualizada);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error actualizando consulta: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/recibo")
    public ResponseEntity<byte[]> generarReciboPdf(@PathVariable Long id) {
        try {
            Consulta consulta = service.getById(id);
            if (consulta == null) {
                return ResponseEntity.notFound().build();
            }

            ByteArrayOutputStream pdfStream = pdfService.generarRecibo(consulta);
            byte[] pdfBytes = pdfStream.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=recibo_" + id + ".pdf");

            return ResponseEntity.ok().headers(headers).body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/receta")
    public ResponseEntity<byte[]> generarRecetaPdf(@PathVariable Long id) {
        try {
            Consulta consulta = service.getById(id);
            if (consulta == null) {
                return ResponseEntity.notFound().build();
            }

            ByteArrayOutputStream pdfStream = pdfService.generarReceta(consulta);
            byte[] pdfBytes = pdfStream.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=receta_" + id + ".pdf");

            return ResponseEntity.ok().headers(headers).body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/pendientes")
    public ResponseEntity<List<Consulta>> getPendientes() {
        return ResponseEntity.ok(consultaService.getConsultasPendientes());
    }

    @GetMapping("/finalizadas")
    public ResponseEntity<List<Consulta>> getFinalizadas() {
        return ResponseEntity.ok(consultaRepository.findByRestanteLessThanEqualOrderByFechaVisitaDesc(0.5));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarConsulta(@PathVariable Long id) {
        try {
            consultaService.eliminarConsulta(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}