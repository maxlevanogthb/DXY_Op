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
    private Long id = 1L;

    private String nombreComercial;
    private String rfc;
    private String telefonoPrincipal;
    private String direccionCorta;

    private LocalTime horaApertura;
    private LocalTime horaCierre;
    private Integer duracionCitaMinutos;

    private Double porcentajeImpuesto;
    private String mensajeTicket;

    private String facebook;
    private String instagram;

    @Column(columnDefinition = "TEXT")
    private String logoSistema;

    @Column(columnDefinition = "TEXT")
    private String logoRecetaIzq;

    @Column(columnDefinition = "TEXT")
    private String logoRecetaDer;

    private String correoRemitente;
    private String passwordCorreo;

    private String textoHero;

    @Column(name = "cedula_profesional")
    private String cedulaProfesional;

    @Column(columnDefinition = "TEXT")
    private String subtituloHero;

    @Column(columnDefinition = "TEXT")
    private String descripcionNosotros;

    private Double porcentajeComisionTarjeta;

    private String colorTema; // Guardará el código Hexadecimal (ej. "#0d6efd")
    private Boolean modoOscuro;

    public String getCedulaProfesional() {
        return cedulaProfesional;
    }

    public void setCedulaProfesional(String cedulaProfesional) {
        this.cedulaProfesional = cedulaProfesional;
    }
}