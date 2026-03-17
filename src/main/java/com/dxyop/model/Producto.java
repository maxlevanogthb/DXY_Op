package com.dxyop.model;

import lombok.Data;
import lombok.ToString;             
import lombok.EqualsAndHashCode;  
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties; 
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


    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "tipo_id", nullable = false)
    @JsonIgnoreProperties({"productos", "hibernateLazyInitializer", "handler"}) 
    @ToString.Exclude          
    @EqualsAndHashCode.Exclude
    private TipoProducto tipo;


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

    @Column(updatable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist 
    protected void onCreate() {
        this.fechaRegistro = LocalDateTime.now();
    }

    private Double precioCosto;
    private Double porcentajeComision;

    
}