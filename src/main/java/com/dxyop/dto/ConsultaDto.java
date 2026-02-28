package com.dxyop.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class ConsultaDto {

    private List<DetalleVentaDto> detalles;

    private Long id;
    private Long clienteId;         // ID del paciente
    private Long productoArmazonId; // ID del producto del inventario (si seleccionó uno)

    private LocalDate fechaVisita;
    private String razonVisita;
    private String diagnosticoOftalmologo;
    // ---  RECETA MÉDICA PARA FARMACIA ---
    private String tratamientoMedico;

    // Agudeza Visual
    private String avLejosOd; // Sin corrección
    private String avLejosOi;
    private String avCercaOd;
    private String avCercaOi;

    private String avActualLejosOd; // Actual
    private String avActualLejosOi;
    private String avActualCercaOd;
    private String avActualCercaOi;

    private String avNuevaLejosOd; // Nueva (Faltaba este)
    private String avNuevaLejosOi;
    private String avNuevaCercaOd;
    private String avNuevaCercaOi;

    private String capacidadVisualOd;
    private String capacidadVisualOi;

    // Refracción
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

    // Presupuesto
    private String material;
    private String tratamiento;
    private String tinte;
    private Double precioMaterial;
    private Double precioTratamiento;
    private Double precioTinte;

    // Armazón
    private String tipoArmazon;
    private String armazonModelo;
    private String armazonColor;
    private Double precioArmazon;

    // Totales
    private Double totalPresupuesto;
    @JsonProperty("aCuenta") 
    private Double aCuenta;
    private Double restante;

    private String estadoEntrega;
}