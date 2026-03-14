package com.dxyop.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString; // <--- Nuevo
import lombok.EqualsAndHashCode; // <--- Nuevo
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "consultas")
@Data
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- RELACIONES ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false) // <--- ¡Corregido!
    @JsonIgnoreProperties({"consultas", "hibernateLazyInitializer", "handler"}) 
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Paciente paciente;

    // --- DATOS GENERALES ---
    private LocalDate fechaVisita = LocalDate.now();

    @Column(name = "razon_visita")
    private String razonVisita;

    @Column(length = 1000, name = "antecedentes_clinicos", columnDefinition = "TEXT")
    private String antecedentesClinicos;

    @Column(length = 1000)
    private String diagnosticoOftalmologo;

    // ---  RECETA MÉDICA PARA FARMACIA ---
    @Column(columnDefinition = "TEXT")
    private String tratamientoMedico;

    // --- 1. AGUDEZA VISUAL ---
    private String avLejosOd;
    private String avLejosOi;
    private String avCercaOd;
    private String avCercaOi;

    // --- 2. AGUDEZA VISUAL ACTUAL ---
    private String avActualLejosOd;
    private String avActualLejosOi;
    private String avActualCercaOd;
    private String avActualCercaOi;

    // --- 3. AGUDEZA VISUAL NUEVA ---
    private String avNuevaLejosOd;
    private String avNuevaLejosOi;
    private String avNuevaCercaOd;
    private String avNuevaCercaOi;

    // Capacidad Visual
    private String capacidadVisualOd;
    private String capacidadVisualOi;

    // --- REFRACCIÓN ---
    private String brutaOdEsfera;
    private String brutaOdCilindro;
    private String brutaOdEje;
    private String brutaOiEsfera;
    private String brutaOiCilindro;
    private String brutaOiEje;

    private String subjetivoOdEsfera;
    private String subjetivoOdCilindro;
    private String subjetivoOdEje;
    private String subjetivoOiEsfera;
    private String subjetivoOiCilindro;
    private String subjetivoOiEje;

    private String adicion;
    private String alturaOblea;
    private String dip;

    // --- TRATAMIENTO Y MATERIALES ---
    private String material;
    private String tratamiento;
    private String tinte;

    private Double precioMaterial;
    private Double precioTratamiento;
    private Double precioTinte;

    // --- ARMAZÓN ---
    private String tipoArmazon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_armazon_id")
    @JsonIgnoreProperties({"consultas", "hibernateLazyInitializer", "handler"}) // <--- BLINDAJE APLICADO AQUÍ TAMBIÉN
    @ToString.Exclude          // <--- IMPORTANTE
    @EqualsAndHashCode.Exclude // <--- IMPORTANTE
    private Producto productoArmazon;

    private String armazonModelo;
    private String armazonColor;
    private Double precioArmazon;

    // --- TOTALES ---

    private Double subtotal;       // La suma de los artículos sin IVA
    private Boolean aplicarIva;    // Para saber si se cobró IVA en esta venta

    private Double totalPresupuesto;
    private Double aCuenta;
    private Double restante;

    // --- METADATOS ---
    @Column(updatable = false)
    private LocalDateTime fechaRegistro;

    // --- ESTADO DE ENTREGA (Laboratorio / Proveedor) ---
    @Column(length = 20)
    private String estadoEntrega;

    @PrePersist
    protected void onCreate() {
        this.fechaRegistro = LocalDateTime.now();
    }

// --- NUEVA RELACIÓN DE PAGOS ---
    @OneToMany(mappedBy = "consulta", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("consulta") // <--- ESTE ES EL BLINDAJE EXTRA
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Pago> pagos = new ArrayList<>();

    @OneToMany(mappedBy = "consulta", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude // <--- NUEVO BLINDAJE
    @EqualsAndHashCode.Exclude // <--- NUEVO BLINDAJE
    private List<DetalleVenta> detalles = new ArrayList<>();

    // Método de utilidad para agregar items y mantener la relación sincronizada
    public void agregarDetalle(DetalleVenta detalle) {
        detalles.add(detalle);
        detalle.setConsulta(this);
    }
    
    public void limpiarDetalles() {
        detalles.clear();
    }

    
}