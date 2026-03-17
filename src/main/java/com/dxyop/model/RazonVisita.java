package com.dxyop.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "razones_visita") 
@Data
public class RazonVisita {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre; 

    private boolean activo = true; 

    @Column(length = 50)
    private String categoria = "CONSULTA"; 

    @Column(length = 10)
    private String colorHex = "#0d6efd"; 
}