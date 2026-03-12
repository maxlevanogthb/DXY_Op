package com.dxyop.service;

import com.dxyop.dto.ConsultaDto;
import com.dxyop.dto.DetalleVentaDto;
//import com.dxyop.dto.PagoDto;
import com.dxyop.model.Paciente;
import com.dxyop.model.Consulta;
import com.dxyop.model.DetalleVenta;
import com.dxyop.model.Pago;
import com.dxyop.model.Producto;
import com.dxyop.repository.PacienteRepository;
import com.dxyop.repository.ConsultaRepository;
import com.dxyop.repository.PagoRepository;
import com.dxyop.repository.ProductoRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConsultaService {

    @Autowired
    private ConsultaRepository consultaRepository;

    @Autowired
    private PacienteRepository clienteRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private PagoRepository pagoRepository;

    public List<Consulta> getByCliente(Long clienteId) {
        return consultaRepository.findByPacienteIdOrderByFechaVisitaDesc(clienteId);
    }

    // En la clase ConsultaService
    public List<Consulta> getHistorialCliente(Long clienteId) {
        return consultaRepository.findByPacienteIdOrderByFechaVisitaDesc(clienteId);
    }

    @Transactional(readOnly = true)
    public Consulta getById(Long id) {
        Consulta consulta = consultaRepository.findById(id).orElse(null);
        

        if (consulta != null) {

            consulta.getDetalles().size(); 

            consulta.getPagos().size(); 
        }
        
        return consulta;
    }

    public Consulta findById(Long id) {
        return consultaRepository.findById(id).orElse(null);
    }

    @Transactional
    public Consulta save(Long clienteId, Consulta consulta) {

        // Vincular Cliente (Evitamos el NullPointer)
        Paciente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        consulta.setPaciente(cliente);

        // Lógica de Inventario (Solo si es NUEVA consulta y trae armazón)
        if (consulta.getId() == null && consulta.getProductoArmazon() != null
                && consulta.getProductoArmazon().getId() != null) {

            // Buscamos el producto real en la BD
            Producto productoDB = productoRepository.findById(consulta.getProductoArmazon().getId())
                    .orElse(null);

            if (productoDB != null) {
                // Descontar Stock
                if (productoDB.getStock() > 0) {
                    productoDB.setStock(productoDB.getStock() - 1);
                    productoRepository.save(productoDB); // Actualizamos inventario
                }

                // Congelar Precio y Datos (Snapshot)
                // Si el usuario no escribió precio manual, usamos el del sistema
                if (consulta.getPrecioArmazon() == null) {
                    consulta.setPrecioArmazon(productoDB.getPrecio().doubleValue());
                }
                // Guardamos marca/modelo como texto por si borran el producto en el futuro
                if (consulta.getArmazonModelo() == null || consulta.getArmazonModelo().isEmpty()) {
                    consulta.setArmazonModelo(productoDB.getNombre());
                }
                if (consulta.getArmazonColor() == null || consulta.getArmazonColor().isEmpty()) {
                    consulta.setArmazonColor(productoDB.getColor());
                }
            }
        }

        return consultaRepository.save(consulta);
    }

    public List<Consulta> getConsultasPendientes() {
        // Buscamos deudas mayores a 0.5 pesos (para ignorar centavos residuales)
        return consultaRepository.findByRestanteGreaterThanOrderByFechaVisitaDesc(0.5);
    }

   @Transactional
    public Consulta guardarConsulta(ConsultaDto dto) {
        Consulta consulta = new Consulta();
        boolean esNueva = (dto.getId() == null);

        if (!esNueva) {
            consulta = consultaRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Consulta no encontrada"));
            // Limpiamos los detalles viejos para reemplazarlos con el nuevo carrito
            consulta.limpiarDetalles();
        }
        
        // Relación con Cliente (Obligatorio)
        Paciente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        consulta.setPaciente(cliente);

        // Relación con Producto/Armazón (Opcional - Compatibilidad vieja)
        if (dto.getProductoArmazonId() != null) {
            Producto producto = productoRepository.findById(dto.getProductoArmazonId()).orElse(null);
            consulta.setProductoArmazon(producto);
        }

        // --- DATOS MÉDICOS ---
        consulta.setFechaVisita(dto.getFechaVisita());
        consulta.setRazonVisita(dto.getRazonVisita());
        consulta.setDiagnosticoOftalmologo(dto.getDiagnosticoOftalmologo());
        consulta.setTratamientoMedico(dto.getTratamientoMedico());

        consulta.setAvLejosOd(dto.getAvLejosOd());
        consulta.setAvLejosOi(dto.getAvLejosOi());
        consulta.setAvCercaOd(dto.getAvCercaOd());
        consulta.setAvCercaOi(dto.getAvCercaOi());

        consulta.setAvActualLejosOd(dto.getAvActualLejosOd());
        consulta.setAvActualLejosOi(dto.getAvActualLejosOi());
        consulta.setAvActualCercaOd(dto.getAvActualCercaOd());
        consulta.setAvActualCercaOi(dto.getAvActualCercaOi());

        consulta.setAvNuevaLejosOd(dto.getAvNuevaLejosOd());
        consulta.setAvNuevaLejosOi(dto.getAvNuevaLejosOi());
        consulta.setAvNuevaCercaOd(dto.getAvNuevaCercaOd());
        consulta.setAvNuevaCercaOi(dto.getAvNuevaCercaOi());

        consulta.setCapacidadVisualOd(dto.getCapacidadVisualOd());
        consulta.setCapacidadVisualOi(dto.getCapacidadVisualOi());

        consulta.setBrutaOdEsfera(dto.getBrutaOdEsfera());
        consulta.setBrutaOdCilindro(dto.getBrutaOdCilindro());
        consulta.setBrutaOdEje(dto.getBrutaOdEje());
        consulta.setBrutaOiEsfera(dto.getBrutaOiEsfera());
        consulta.setBrutaOiCilindro(dto.getBrutaOiCilindro());
        consulta.setBrutaOiEje(dto.getBrutaOiEje());

        consulta.setSubjetivoOdEsfera(dto.getSubjetivoOdEsfera());
        consulta.setSubjetivoOdCilindro(dto.getSubjetivoOdCilindro());
        consulta.setSubjetivoOdEje(dto.getSubjetivoOdEje());
        consulta.setSubjetivoOiEsfera(dto.getSubjetivoOiEsfera());
        consulta.setSubjetivoOiCilindro(dto.getSubjetivoOiCilindro());
        consulta.setSubjetivoOiEje(dto.getSubjetivoOiEje());

        consulta.setAdicion(dto.getAdicion());
        consulta.setAlturaOblea(dto.getAlturaOblea());
        consulta.setDip(dto.getDip());

        // --- DATOS FINANCIEROS NUEVOS (V2.0) ---
        consulta.setSubtotal(dto.getSubtotal());
        consulta.setAplicarIva(dto.getAplicarIva() != null ? dto.getAplicarIva() : false);

        boolean requiereLaboratorio = false;
        
        // --- 4. EL NUEVO CARRITO DE COMPRAS (Detalles e Inventario) ---
        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            
            for (DetalleVentaDto detDto : dto.getDetalles()) {
                DetalleVenta detalle = new DetalleVenta();
                detalle.setTipoItem(detDto.getTipoItem());
                detalle.setDescripcion(detDto.getDescripcion());
                detalle.setCantidad(detDto.getCantidad());
                detalle.setPrecioUnitario(detDto.getPrecioUnitario());
                detalle.setSubtotal(detDto.getSubtotal());
                
                detalle.setMaterial(detDto.getMaterial());
                detalle.setTratamiento(detDto.getTratamiento());
                detalle.setTinte(detDto.getTinte());
                detalle.setProductoInventarioId(detDto.getProductoInventarioId());

                consulta.agregarDetalle(detalle);

                // Descontar Stock solo si es Venta Nueva
                if (esNueva && detDto.getProductoInventarioId() != null) {
                    Producto prodBD = productoRepository.findById(detDto.getProductoInventarioId()).orElse(null);
                    if (prodBD != null && prodBD.getStock() > 0) {
                        prodBD.setStock(prodBD.getStock() - 1);
                        productoRepository.save(prodBD);
                    }
                }

                // Detectar si requiere espera
                if ("LENTE".equals(detDto.getTipoItem()) || "CONTACTO".equals(detDto.getTipoItem())) {
                    requiereLaboratorio = true;
                }
            }

            // Modo compatibilidad
            DetalleVentaDto itemPrincipal = dto.getDetalles().get(0);
            consulta.setMaterial(itemPrincipal.getMaterial());
            consulta.setTratamiento(itemPrincipal.getTratamiento());
            consulta.setTinte(itemPrincipal.getTinte());
            consulta.setArmazonModelo(itemPrincipal.getDescripcion());
            consulta.setPrecioArmazon(itemPrincipal.getSubtotal()); 
        } else {
            consulta.setMaterial(null);
            consulta.setArmazonModelo("Solo Consulta / Sin Producto");
            consulta.setPrecioArmazon(0.0);
        }

        // --- ESTADO DE ENTREGA ---
        if (dto.getEstadoEntrega() != null) {
            consulta.setEstadoEntrega(dto.getEstadoEntrega());
        } else if (esNueva || consulta.getEstadoEntrega() == null) {
            if (requiereLaboratorio) consulta.setEstadoEntrega("PENDIENTE"); 
            else consulta.setEstadoEntrega("NO_APLICA"); 
        }

        // --- 5. TOTALES Y PAGOS ---
        Double total = dto.getTotalPresupuesto() != null ? dto.getTotalPresupuesto() : 0.0;
        consulta.setTotalPresupuesto(total);

        if (esNueva) {
            consulta.setACuenta(0.0); 
            consulta.setRestante(total);
            consulta = consultaRepository.save(consulta);
        } 
        else {
            consulta = consultaRepository.save(consulta);
            Double totalPagado = pagoRepository.findByConsultaIdOrderByFechaPagoDesc(consulta.getId())
                    .stream().mapToDouble(Pago::getMonto).sum();
            
            consulta.setACuenta(totalPagado);
            consulta.setRestante(consulta.getTotalPresupuesto() - totalPagado);
            consulta = consultaRepository.save(consulta);
        }

        return consulta;
    }
}