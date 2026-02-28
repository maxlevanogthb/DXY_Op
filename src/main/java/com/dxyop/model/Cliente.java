package com.dxyop.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;             // <--- IMPORTAR
import lombok.EqualsAndHashCode;    // <--- IMPORTAR
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.time.Period;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "clientes")
@Data
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String telefono;

    private String email;

    // FECHAS 
    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    // Lógica de edad (No es columna, es cálculo)
    public Integer getEdad() {
        if (this.fechaNacimiento == null) {
            return null;
        }
        return Period.between(this.fechaNacimiento, LocalDate.now()).getYears();
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

    // --- RELACIÓN SEGURA ---
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore // Para JSON: No enviar historial al pedir datos del cliente
    @ToString.Exclude // Para JAVA: No imprimir historial en logs (Evita StackOverflow)
    @EqualsAndHashCode.Exclude // Para JAVA: No usar historial para comparar objetos
    private List<Consulta> consultas = new ArrayList<>();

    // AUTOMATIZAR FECHA AL GUARDAR
    @PrePersist
    protected void onCreate() {
        this.fechaRegistro = LocalDate.now();
    }
}