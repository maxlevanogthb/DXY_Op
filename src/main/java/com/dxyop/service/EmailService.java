package com.dxyop.service;

import com.dxyop.model.ConfiguracionGeneral;
import com.dxyop.repository.ConfiguracionGeneralRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
public class EmailService {

    @Autowired
    private ConfiguracionGeneralRepository configRepo;

    public void enviarCorreoConAdjunto(String para, String asunto, String cuerpoHtml, byte[] archivoPdf, String nombreArchivo) throws Exception {
        // 1. Obtener credenciales de la BD
        ConfiguracionGeneral config = configRepo.findById(1L)
                .orElseThrow(() -> new Exception("Falta configurar la información general."));

        if (config.getCorreoRemitente() == null || config.getPasswordCorreo() == null || config.getCorreoRemitente().isEmpty()) {
            throw new Exception("El correo o la contraseña no están configurados en el panel.");
        }

        // 2. Configurar el Servidor SMTP dinámicamente (Usamos Gmail por defecto)
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(config.getCorreoRemitente());
        mailSender.setPassword(config.getPasswordCorreo());

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "false"); // Cambia a true si quieres ver logs en la consola

        // 3. Crear el mensaje de correo
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        String nombreOptica = config.getNombreComercial() != null ? config.getNombreComercial() : "Óptica DXY";
        
        helper.setFrom(config.getCorreoRemitente(), nombreOptica);
        helper.setTo(para);
        helper.setSubject(asunto);
        helper.setText(cuerpoHtml, true); // "true" indica que usamos diseño HTML

        // 4. Adjuntar el archivo PDF
        helper.addAttachment(nombreArchivo, new ByteArrayResource(archivoPdf));

        // 5. ¡Enviar!
        mailSender.send(message);

        
    }

    // Método para enviar correos simples SIN adjuntos (Para recordatorios)
    public void enviarCorreoSimple(String para, String asunto, String cuerpoHtml) throws Exception {
        ConfiguracionGeneral config = configRepo.findById(1L)
                .orElseThrow(() -> new Exception("Falta configurar la información general."));

        if (config.getCorreoRemitente() == null || config.getPasswordCorreo() == null) {
            throw new Exception("El correo no está configurado.");
        }

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(config.getCorreoRemitente());
        mailSender.setPassword(config.getPasswordCorreo());

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8"); // false = sin adjuntos

        String nombreOptica = config.getNombreComercial() != null ? config.getNombreComercial() : "Óptica DXY";
        helper.setFrom(config.getCorreoRemitente(), nombreOptica);
        helper.setTo(para);
        helper.setSubject(asunto);
        helper.setText(cuerpoHtml, true); 

        mailSender.send(message);
    }
}