package com.dxyop.controller;

import com.dxyop.model.Consulta;
import com.dxyop.repository.ConsultaRepository;
import com.dxyop.service.EmailService;
import com.dxyop.service.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@RestController
@RequestMapping("/api/correos")
public class CorreoController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private PdfService pdfService;

    @Autowired
    private ConsultaRepository consultaRepo;

    @PostMapping("/enviar-recibo/{idConsulta}")
    public ResponseEntity<?> enviarReciboPDF(@PathVariable Long idConsulta, @RequestBody Map<String, String> payload) {
        try {
            String correoDestino = payload.get("correo");
            if (correoDestino == null || correoDestino.isEmpty()) {
                throw new Exception("Debe proporcionar un correo válido.");
            }

            Consulta consulta = consultaRepo.findById(idConsulta)
                    .orElseThrow(() -> new Exception("Consulta no encontrada"));

            // 1. Generar el PDF usando el servicio que ya tienes
            ByteArrayOutputStream pdfStream = pdfService.generarRecibo(consulta);
            byte[] pdfBytes = pdfStream.toByteArray();

            // 2. Preparar los textos del correo
            String asunto = "Recibo de Compra - Folio #" + consulta.getId();
            String cuerpoHtml = "<div style='font-family: Arial, sans-serif; padding: 20px;'>"
                    + "<h2 style='color: #0d6efd;'>¡Hola " + consulta.getPaciente().getNombre() + "!</h2>"
                    + "<p>Adjunto a este correo encontrará el recibo detallado de su reciente visita.</p>"
                    + "<p>Gracias por confiar su salud visual con nosotros.</p>"
                    + "<hr>"
                    + "<p style='font-size: 12px; color: #6c757d;'>Este es un correo automático, por favor no responda a esta dirección.</p>"
                    + "</div>";

            // 3. Enviar el correo
            emailService.enviarCorreoConAdjunto(
                    correoDestino, 
                    asunto, 
                    cuerpoHtml, 
                    pdfBytes, 
                    "Recibo_Optica_" + consulta.getId() + ".pdf"
            );

            return ResponseEntity.ok().body(Map.of("mensaje", "Correo enviado exitosamente."));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/recordatorio")
    public ResponseEntity<?> enviarRecordatorioDashboard(@RequestBody Map<String, String> payload) {
        try {
            String correo = payload.get("correo");
            String paciente = payload.get("paciente");
            String deuda = payload.get("restante");

            String asunto = "Aviso de Saldo Pendiente";
            String cuerpoHtml = "<div style='font-family: Arial, sans-serif; padding: 20px; text-align: center;'>"
                    + "<h2 style='color: #dc3545;'>Aviso de Saldo Pendiente</h2>"
                    + "<p>Hola <b>" + paciente + "</b>,</p>"
                    + "<p>Le escribimos amablemente para recordarle que su cuenta presenta un saldo pendiente de:</p>"
                    + "<h1 style='color: #212529;'>$" + deuda + "</h1>"
                    + "<p>Quedamos a su entera disposición si tiene alguna duda.</p>"
                    + "<hr><p style='font-size: 12px; color: #6c757d;'>Este es un correo automático de nuestro sistema.</p>"
                    + "</div>";

            emailService.enviarCorreoSimple(correo, asunto, cuerpoHtml);
            return ResponseEntity.ok().body(Map.of("mensaje", "Recordatorio enviado"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}