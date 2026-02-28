package com.dxyop.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "clientes_potenciales")
@Data
public class ClientePotencial {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "client_potencial_seq")
    @SequenceGenerator(name = "client_potencial_seq", sequenceName = "client_potencial_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String telefono;

    private String email;

    private String motivo;

    private String fecha;

    private String mensaje;

    @Enumerated(EnumType.STRING)
    private EstadoClientePotencial estado = EstadoClientePotencial.PENDIENTE;

    private LocalDateTime fechaRegistro = LocalDateTime.now();
}
