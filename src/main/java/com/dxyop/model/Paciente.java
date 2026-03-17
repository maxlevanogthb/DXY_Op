package com.dxyop.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "pacientes")
@Data
public class Paciente { 

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String telefono;

    private String email;


    @Column(name = "es_paciente_oficial", nullable = false)
    private boolean esPacienteOficial = false; // false = Cliente Potencial, true = Paciente Oficial

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

    private String motivo;
    private String graduacionActual;

    @Column(columnDefinition = "TEXT")
    private String mensaje; 

    private Long ultimoLenteId;
    private boolean activo = true;

    // mappedBy ahora debe apuntar a "paciente", no a "cliente"
    @OneToMany(mappedBy = "paciente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore 
    @ToString.Exclude 
    @EqualsAndHashCode.Exclude 
    private List<Consulta> consultas = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.fechaRegistro = LocalDate.now();
    }
}