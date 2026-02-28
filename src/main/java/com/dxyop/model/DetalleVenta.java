package com.dxyop.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "detalles_venta")
public class DetalleVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con la Consulta (Padre)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consulta_id", nullable = false)
    @JsonIgnore // Evita bucles infinitos al convertir a JSON
    private Consulta consulta;

    // Tipo: "LENTE", "ACCESORIO", "CONSULTA", "CONTACTO"
    private String tipoItem; 

    // Descripción: "Lente RayBan Aviator + Micas BlueRay"
    @Column(length = 500)
    private String descripcion;

    private Integer cantidad;
    private Double precioUnitario;
    private Double subtotal; // cantidad * precioUnitario

    // --- CAMPOS OPCIONALES (Solo si es un Lente) ---
    // Guardamos esto aquí para saber qué llevó exactamente este item
    private String material;
    private String tratamiento;
    private String tinte;
    
    // Si queremos saber exactamente qué ID de inventario se descontó
    private Long productoInventarioId;
}