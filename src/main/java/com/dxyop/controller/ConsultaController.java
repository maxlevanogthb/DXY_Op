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
@RequiredArgsConstructor // ¡Esto inyecta todos los campos 'final'!
public class ConsultaController {

    // --- DEPENDENCIAS (Todas 'final' para que Lombok las inyecte) ---
    private final ConsultaService service;
    private final ConsultaRepository consultaRepository;
    private final ConsultaService consultaService;
    private final PdfService pdfService;

    // --- 1. OBTENER HISTORIAL (Reemplaza al método antiguo conflictivo) ---
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Consulta>> getHistorialPorCliente(@PathVariable Long clienteId) {
        List<Consulta> historial = service.getHistorialCliente(clienteId);
        if (historial.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(historial);
    }

    // --- 2. OBTENER UNA CONSULTA POR ID (Evitando el Lazy Loading) ---
    @GetMapping("/{id}")
    public ResponseEntity<Consulta> getById(@PathVariable Long id) {
        Consulta consulta = service.getById(id);
        if (consulta == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Despertamos los detalles y los pagos antes de mandar el JSON al Frontend
        if(consulta.getDetalles() != null) {
            consulta.getDetalles().size(); 
        }
        if(consulta.getPagos() != null) {
            consulta.getPagos().size();
        }
        
        return ResponseEntity.ok(consulta);
    }

    // --- 3. CREAR NUEVA CONSULTA (Usando DTO y el Service correcto) ---
    @PostMapping
    public ResponseEntity<?> create(@RequestBody ConsultaDto dto) {
        try {
            // Aseguramos que el ID venga nulo para que el Service sepa que es nueva
            dto.setId(null); 
            
            // Delegamos TODA la lógica de guardado (incluyendo carrito y receta) a tu Service
            Consulta guardada = service.guardarConsulta(dto);
            
            return ResponseEntity.ok(guardada);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error guardando consulta: " + e.getMessage());
        }
    }

    // --- 4. ACTUALIZAR CONSULTA (Usando DTO y el Service correcto) ---
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ConsultaDto dto) {
        try {
            // Aseguramos que el DTO traiga el ID correcto de la URL
            dto.setId(id);
            
            // Delegamos TODA la lógica de actualización (incluyendo borrar el carrito viejo) a tu Service
            Consulta actualizada = service.guardarConsulta(dto);
            
            return ResponseEntity.ok(actualizada);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error actualizando consulta: " + e.getMessage());
        }
    }

    // --- 5. PDF: RECIBO ---
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

    // --- 6. PDF: RECETA ---
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

    // Obtener SOLO deudores
    @GetMapping("/pendientes")
    public ResponseEntity<List<Consulta>> getPendientes() {
        // Buscamos deudas mayores a 50 centavos
        return ResponseEntity.ok(consultaService.getConsultasPendientes());
        // Asegúrate de crear este método puente en tu Service llamando al repository
    }

    // Obtener SOLO pagadas (Historial de ventas cerradas)
    @GetMapping("/finalizadas")
    public ResponseEntity<List<Consulta>> getFinalizadas() {
        // Buscamos deudas menores o iguales a 50 centavos (pagado)
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