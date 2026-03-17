package com.dxyop.controller;

import com.dxyop.model.Consulta;
import com.dxyop.model.Pago;
import com.dxyop.repository.ConsultaRepository;
import com.dxyop.repository.PagoRepository;
import com.dxyop.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Controller
@RequestMapping("/imprimir")
@RequiredArgsConstructor
public class ImpresionController {

    private final PagoRepository pagoRepository;
    private final ConsultaRepository consultaRepository;
    private final PdfService pdfService;

    @GetMapping("/recibo/{id}")
    public ResponseEntity<byte[]> descargarRecibo(@PathVariable Long id) {
        try {
            Consulta consulta = consultaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Consulta no encontrada"));

            // Generar PDF usando tu código
            ByteArrayOutputStream out = pdfService.generarRecibo(consulta);

            // Configurar la respuesta para que sea un PDF descargable
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            // "inline" hace que se abra en el navegador. "attachment" lo descarga directo.
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=recibo_" + id + ".pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(out.toByteArray());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/receta/{id}")
    public ResponseEntity<byte[]> descargarReceta(@PathVariable Long id) {
        try {
            Consulta consulta = consultaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Consulta no encontrada"));

            ByteArrayOutputStream out = pdfService.generarReceta(consulta);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=receta_" + id + ".pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(out.toByteArray());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // IMPRIMIR ESTADO DE CUENTA (Tabla de Amortización)
    @GetMapping("/estado-cuenta/{id}")
    public ResponseEntity<byte[]> descargarEstadoCuenta(@PathVariable Long id) {
        try {
            Consulta consulta = consultaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Consulta no encontrada"));

            List<Pago> historialPagos = pagoRepository.findByConsultaIdOrderByFechaPagoDesc(id);

            ByteArrayOutputStream out = pdfService.generarEstadoCuenta(consulta, historialPagos);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            // El nombre del archivo indicará si está pagado o no
            String status = (consulta.getRestante() <= 0.1) ? "LIQUIDADO" : "PENDIENTE";
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=EstadoCuenta_" + status + "_" + id + ".pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(out.toByteArray());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
   
}