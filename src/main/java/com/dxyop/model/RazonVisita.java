package com.dxyop.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "razones_visita") // Crea una tabla nueva
@Data
public class RazonVisita {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre; // Ej: "Primera Consulta"

    private boolean activo = true; // Para borrado lógico

    @Column(length = 50)
    private String categoria = "CONSULTA"; 

    @Column(length = 10)
    private String colorHex = "#0d6efd"; // Azul por defecto
}