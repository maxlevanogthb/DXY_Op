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

        // Relación con Producto/Armazón (Opcional)
        if (dto.getProductoArmazonId() != null) {
            Producto producto = productoRepository.findById(dto.getProductoArmazonId()).orElse(null);
            consulta.setProductoArmazon(producto);
        }

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

            consulta.setMaterial(dto.getMaterial());
            consulta.setTratamiento(dto.getTratamiento());
            consulta.setTinte(dto.getTinte());

            consulta.setPrecioMaterial(dto.getPrecioMaterial());
            consulta.setPrecioTratamiento(dto.getPrecioTratamiento());
            consulta.setPrecioTinte(dto.getPrecioTinte());

            consulta.setTipoArmazon(dto.getTipoArmazon());
            consulta.setArmazonModelo(dto.getArmazonModelo());
            consulta.setArmazonColor(dto.getArmazonColor());
            consulta.setPrecioArmazon(dto.getPrecioArmazon());

            boolean requiereLaboratorio = false;
        
       // 4. EL NUEVO CARRITO DE COMPRAS (Detalles)
        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            
            // Recorremos el carrito que viene del Frontend
            for (DetalleVentaDto detDto : dto.getDetalles()) {
                DetalleVenta detalle = new DetalleVenta();
                detalle.setTipoItem(detDto.getTipoItem());
                detalle.setDescripcion(detDto.getDescripcion());
                detalle.setCantidad(detDto.getCantidad());
                detalle.setPrecioUnitario(detDto.getPrecioUnitario());
                detalle.setSubtotal(detDto.getSubtotal());
                
                // Opcionales para lentes
                detalle.setMaterial(detDto.getMaterial());
                detalle.setTratamiento(detDto.getTratamiento());
                detalle.setTinte(detDto.getTinte());
                detalle.setProductoInventarioId(detDto.getProductoInventarioId());

                consulta.agregarDetalle(detalle);

                // --- DETECTAR SI REQUIERE ESPERA ---
                if ("LENTE".equals(detDto.getTipoItem()) || "CONTACTO".equals(detDto.getTipoItem())) {
                    requiereLaboratorio = true;
                }
            }

            // --- MODO COMPATIBILIDAD (Para no romper tus recibos PDF) ---
            // Tomamos el primer item (generalmente el lente principal) y llenamos los campos viejos
            DetalleVentaDto itemPrincipal = dto.getDetalles().get(0);
            consulta.setMaterial(itemPrincipal.getMaterial());
            consulta.setTratamiento(itemPrincipal.getTratamiento());
            consulta.setTinte(itemPrincipal.getTinte());
            
            // Usamos la descripción del carrito como el "Modelo del Armazón" para el PDF
            consulta.setArmazonModelo(itemPrincipal.getDescripcion());
            consulta.setPrecioArmazon(itemPrincipal.getSubtotal()); 
        } else {
            // Si por alguna razón envían vacío, vaciamos los campos de compatibilidad
            consulta.setMaterial(null);
            consulta.setArmazonModelo("Solo Consulta / Sin Producto");
            consulta.setPrecioArmazon(0.0);
        }

        // --- ASIGNACIÓN DEL ESTADO DE ENTREGA ---
        if (dto.getEstadoEntrega() != null) {
            // 1. PRIORIDAD MÁXIMA: Lo que el doctor elija en la pantalla, se respeta siempre.
            consulta.setEstadoEntrega(dto.getEstadoEntrega());
        } else if (esNueva || consulta.getEstadoEntrega() == null) {
            // 2. SOLO SI ES NUEVA: El sistema detecta si requiere mandarse a hacer
            if (requiereLaboratorio) {
                consulta.setEstadoEntrega("PENDIENTE"); 
            } else {
                consulta.setEstadoEntrega("NO_APLICA"); 
            }
        }

        // 5. Lógica Financiera (Igual)
        Double total = dto.getTotalPresupuesto() != null ? dto.getTotalPresupuesto() : 0.0;
        consulta.setTotalPresupuesto(total);

        if (esNueva) {
            consulta.setACuenta(0.0); // El JS mandará el pago aparte
            consulta.setRestante(total);
            consulta = consultaRepository.save(consulta);
        } 
        else {
            consulta = consultaRepository.save(consulta);
            // Recalculamos matemáticamente basado en el historial de pagos real
            Double totalPagado = pagoRepository.findByConsultaIdOrderByFechaPagoDesc(consulta.getId())
                    .stream().mapToDouble(Pago::getMonto).sum();
            
            consulta.setACuenta(totalPagado);
            consulta.setRestante(consulta.getTotalPresupuesto() - totalPagado);
            consulta = consultaRepository.save(consulta);
        }

        return consulta;
    }
}