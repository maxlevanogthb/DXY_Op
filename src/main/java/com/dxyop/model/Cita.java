package com.dxyop.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "citas")
@Data
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false) 
    private Paciente paciente; 

    // Fechas y bloque de tiempo
    @Column(nullable = false)
    private LocalDateTime inicio; // Ejemplo: 2026-02-23 16:00
    
    @Column(nullable = false)
    private LocalDateTime fin;    // Ejemplo: 2026-02-23 16:45

    // Tipo para el Código de Colores (Consulta, Entrega, Ajuste)
    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false, length = 20)
    private String estado = "PENDIENTE";

    @Column(columnDefinition = "TEXT")
    private String notas; 
}