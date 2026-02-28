package com.dxyop.model;

import lombok.Data;
import lombok.ToString;             // <--- IMPORTANTE
import lombok.EqualsAndHashCode;    // <--- IMPORTANTE
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // <--- USAR ESTE EN LUGAR DE IGNORE
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;

@Data
@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    // --- RELACIÓN CORREGIDA ---
    // Queremos ver el Tipo en el JSON, pero sin bucles
    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "tipo_id", nullable = false)
    // 1. "productos": Asumiendo que TipoProducto tiene una lista de productos, la ignoramos.
    // 2. "hibernateLazyInitializer", "handler": Evita errores al usar FetchType.LAZY
    @JsonIgnoreProperties({"productos", "hibernateLazyInitializer", "handler"}) 
    @ToString.Exclude          // <--- Protege tus logs
    @EqualsAndHashCode.Exclude // <--- Protege comparaciones
    private TipoProducto tipo;

    // ---------------------------

    @Column(name = "sub_tipo")
    private String subTipo;

    @Column(nullable = false)
    private String marca;

    private String modelo;

    private String color;

    private String talla;

    @JsonProperty("precioVenta") 
    @Column(nullable = false)
    private BigDecimal precio;

    private Integer stock;

    private boolean activo = true;

    @Column(updatable = false) // Buena práctica: que no cambie al editar
    private LocalDateTime fechaRegistro;

    @PrePersist // Asegura que la fecha se ponga sola antes de guardar
    protected void onCreate() {
        this.fechaRegistro = LocalDateTime.now();
    }
}