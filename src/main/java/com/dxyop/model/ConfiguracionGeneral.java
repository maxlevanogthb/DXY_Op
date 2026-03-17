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

    // Datos del Negocio
    private String nombreComercial;
    private String rfc;
    private String telefonoPrincipal;
    private String direccionCorta;

    // Configuración de Agenda
    private LocalTime horaApertura;
    private LocalTime horaCierre;
    private Integer duracionCitaMinutos;

    // Configuración de Ventas
    private Double porcentajeImpuesto;
    private String mensajeTicket;

    // Redes Sociales
    private String facebook;
    private String instagram;

    // Logos (Guardados en formato Base64)
    @Column(columnDefinition = "TEXT")
    private String logoSistema; 

    @Column(columnDefinition = "TEXT")
    private String logoRecetaIzq; 

    @Column(columnDefinition = "TEXT")
    private String logoRecetaDer; 

    // Configuración de Correo (SMTP)
    private String correoRemitente; 
    private String passwordCorreo;  

    // Textos de la Landing Page (Sitio Web)
    private String textoHero; 
    
    @Column(columnDefinition = "TEXT")
    private String subtituloHero;
    
    @Column(columnDefinition = "TEXT")
    private String descripcionNosotros;

    private Double porcentajeComisionTarjeta;

    private String colorTema; // Guardará el código Hexadecimal (ej. "#0d6efd")
    private Boolean modoOscuro; 
    
}