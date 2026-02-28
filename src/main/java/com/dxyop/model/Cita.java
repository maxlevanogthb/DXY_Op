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

    // Relación opcional: Puede ser un paciente que ya existe en tu tabla Clientes
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    // Opcional: Para pacientes nuevos ("Express") que llaman por teléfono
    @Column(name = "nombre_temporal", length = 100)
    private String nombreTemporal;
    
    @Column(name = "telefono_temporal", length = 20)
    private String telefonoTemporal;

    // Fechas y bloque de tiempo
    @Column(nullable = false)
    private LocalDateTime inicio; // Ejemplo: 2026-02-23 16:00
    
    @Column(nullable = false)
    private LocalDateTime fin;    // Ejemplo: 2026-02-23 16:45

    // Tipo para el Código de Colores (Consulta, Entrega, Ajuste)
    @Column(nullable = false, length = 50)
    private String tipo;

    // PENDIENTE, CONFIRMADA, ATENDIDA, CANCELADA, FALTA
    @Column(nullable = false, length = 20)
    private String estado = "PENDIENTE";

    @Column(columnDefinition = "TEXT")
    private String notas; // "El paciente dice que se le rompió la patita del armazón"
}