package com.dxyop.model;

import java.math.BigDecimal;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "opciones_lente")
public class OpcionLente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Valores esperados: "MATERIAL", "TRATAMIENTO", "TINTE"
    @Column(nullable = false)
    private String categoria;

    @Column(nullable = false)
    private String nombre; 

    @Column(name = "precio_base")
    private BigDecimal precioBase; 

    @Column(name = "precio_costo")
    private Double precioCosto = 0.0;

    @Column(name = "porcentaje_comision")
    private Double porcentajeComision = 0.0;

    // Constructor vacío obligatorio para JPA
    public OpcionLente() {}
    

    // Constructor útil
    public OpcionLente(String categoria, String nombre, BigDecimal precioBase) {
        this.categoria = categoria;
        this.nombre = nombre;
        this.precioBase = precioBase;
    }


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public BigDecimal getPrecioBase() { return precioBase; }
    public void setPrecioBase(BigDecimal precioBase) { this.precioBase = precioBase; }


    public Double getPrecioCosto() {
        return precioCosto;
    }


    public void setPrecioCosto(Double precioCosto) {
        this.precioCosto = precioCosto;
    }


    public Double getPorcentajeComision() {
        return porcentajeComision;
    }


    public void setPorcentajeComision(Double porcentajeComision) {
        this.porcentajeComision = porcentajeComision;
    } 

    
}