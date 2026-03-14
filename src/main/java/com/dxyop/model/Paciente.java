package com.dxyop.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.time.Period;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "pacientes") // <-- CAMBIO 1: Nueva tabla
@Data
public class Paciente { // <-- CAMBIO 2: Nuevo nombre

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String telefono;

    private String email;

    // ==========================================
    // CAMBIO 3: LA BANDERA DEL MINI-CRM
    // ==========================================
    @Column(name = "es_paciente_oficial", nullable = false)
    private boolean esPacienteOficial = false; // false = Cliente Potencial, true = Paciente Oficial

    // FECHAS 
    @Column(name = "edad")
    private Integer edad;

    // Lógica de edad (No es columna, es cálculo)
    public Integer getEdad() {
        if (this.edad == null) {
            return null;
        }
        return edad;
    }

    @Column(name = "fecha_registro", updatable = false)
    private LocalDate fechaRegistro;

    // DATOS CLÍNICOS BÁSICOS
    private String motivo;
    private String graduacionActual;

    @Column(columnDefinition = "TEXT")
    private String mensaje; 

    // RELACIONES Y ESTADO
    private Long ultimoLenteId;
    private boolean activo = true;

    // ==========================================
    // CAMBIO 4: ARREGLAR LA RELACIÓN
    // ==========================================
    // mappedBy ahora debe apuntar a "paciente", no a "cliente"
    @OneToMany(mappedBy = "paciente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore 
    @ToString.Exclude 
    @EqualsAndHashCode.Exclude 
    private List<Consulta> consultas = new ArrayList<>();

    // AUTOMATIZAR FECHA AL GUARDAR
    @PrePersist
    protected void onCreate() {
        this.fechaRegistro = LocalDate.now();
    }
}