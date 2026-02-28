package com.dxyop.dto;

import lombok.Data;

@Data
public class DetalleVentaDto {
    private String tipoItem;
        private String descripcion;
        private Integer cantidad;
        private Double precioUnitario;
        private Double subtotal;
        
        // Opcionales para lentes
        private String material;
        private String tratamiento;
        private String tinte;
        private Long productoInventarioId;
}
