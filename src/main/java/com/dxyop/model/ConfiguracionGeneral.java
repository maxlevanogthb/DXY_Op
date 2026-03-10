package com.dxyop.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import java.time.LocalTime;

@Entity
@Table(name = "configuracion_general")
@Data
public class ConfiguracionGeneral {

    @Id
    private Long id = 1L; // Forzamos a que siempre sea el registro 1

    // 1. Datos del Negocio
    private String nombreComercial;
    private String rfc;
    private String telefonoPrincipal;
    private String direccionCorta;

    // 2. Configuración de Agenda
    private LocalTime horaApertura;
    private LocalTime horaCierre;
    private Integer duracionCitaMinutos;

    // 3. Configuración de Ventas
    private Double porcentajeImpuesto;
    private String mensajeTicket;

    // 4. Redes Sociales
    private String facebook;
    private String instagram;

    // 5. Logos (Guardados en formato Base64)
    @Column(columnDefinition = "TEXT")
    private String logoSistema; // Para Login, Menú superior y Recibos

    @Column(columnDefinition = "TEXT")
    private String logoRecetaIzq; // Reemplaza al logo del IPN

    @Column(columnDefinition = "TEXT")
    private String logoRecetaDer; // Reemplaza al logo de Optometría

    // 6. Configuración de Correo (SMTP)
    private String correoRemitente; // Ej. contacto@opticadxy.com o gmail
    private String passwordCorreo;  // Contraseña de aplicación

    // 7. Textos de la Landing Page (Sitio Web)
    private String textoHero; // Ej. "Cuidamos tu visión con experiencia..."
    
    @Column(columnDefinition = "TEXT")
    private String subtituloHero; // <--- ESTO ES LO QUE FALTABA
    
    @Column(columnDefinition = "TEXT")
    private String descripcionNosotros;

    private Double porcentajeComisionTarjeta;
    
}