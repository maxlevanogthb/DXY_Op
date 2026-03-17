package com.dxyop.service;

import com.dxyop.model.Consulta;
import com.dxyop.model.Pago;
import com.dxyop.model.Paciente;
import com.dxyop.model.ConfiguracionGeneral;
import com.dxyop.repository.ConfiguracionGeneralRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;

@Service
public class PdfService {

    private static final Font FONT_TITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
    private static final Font FONT_SUBTITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
    private static final Font FONT_CUERPO = FontFactory.getFont(FontFactory.HELVETICA, 10);
    private static final Font FONT_CUERPO_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    private static final Font FONT_RX = FontFactory.getFont(FontFactory.COURIER, 12, Font.BOLD);
    private static final DecimalFormat DF = new DecimalFormat("$#,##0.00");
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FORMATO_FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final String NOMBRE_PROFESIONAL = "L.O. Marco Antonio Levano Tovar";
    private static final String CEDULA_PROFESIONAL = "xxxxxxxxxxxxxx";

    @Autowired
    private ConfiguracionGeneralRepository configRepo;

    private ConfiguracionGeneral getConfig() {
        return configRepo.findById(1L).orElse(new ConfiguracionGeneral());
    }

    // --- LECTOR DE IMÁGENES BASE64 ---
    private Image obtenerImagen(String base64, String defaultPath) {
        try {
            if (base64 != null && base64.startsWith("data:image")) {
                String base64Data = base64.split(",")[1];
                byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);
                return Image.getInstance(imageBytes);
            } else if (defaultPath != null) {
                return Image.getInstance(new ClassPathResource(defaultPath).getURL());
            }
        } catch (Exception e) {
            // Ignorar y retornar null si falla
        }
        return null;
    }

    public ByteArrayOutputStream generarRecibo(Consulta consulta) throws DocumentException, IOException {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        ConfiguracionGeneral config = getConfig();
        String nombreOptica = config.getNombreComercial() != null ? config.getNombreComercial() : "Óptica DXY";
        String direccionOptica = config.getDireccionCorta() != null ? config.getDireccionCorta() : "";
        String telefonoOptica = config.getTelefonoPrincipal() != null ? config.getTelefonoPrincipal() : "";
        String mensajeFooter = config.getMensajeTicket() != null && !config.getMensajeTicket().isEmpty() ? config.getMensajeTicket() : "¡Gracias por su preferencia!";

        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[] { 1, 2 });

        // LOGO SISTEMA
        Image logo = obtenerImagen(config.getLogoSistema(), "images/logo_dxy.png");
        if (logo != null) {
            logo.scaleToFit(100, 100);
            PdfPCell cellLogo = new PdfPCell(logo);
            cellLogo.setBorder(Rectangle.NO_BORDER);
            headerTable.addCell(cellLogo);
        } else {
            headerTable.addCell(new PdfPCell(new Phrase(nombreOptica, FONT_TITULO)));
        }

        Paragraph datosOptica = new Paragraph();
        datosOptica.add(new Phrase("RECIBO #" + consulta.getId() + "\n", FONT_TITULO));
        datosOptica.add(new Phrase(nombreOptica + "\n", FONT_SUBTITULO));
        if(config.getRfc() != null && !config.getRfc().isEmpty()) {
            datosOptica.add(new Phrase("RFC: " + config.getRfc() + "\n", FONT_CUERPO));
        }
        datosOptica.add(new Phrase(direccionOptica + " • " + telefonoOptica, FONT_CUERPO));
        PdfPCell cellDatos = new PdfPCell(datosOptica);
        cellDatos.setBorder(Rectangle.NO_BORDER);
        cellDatos.setHorizontalAlignment(Element.ALIGN_RIGHT);
        headerTable.addCell(cellDatos);

        document.add(headerTable);
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("Cliente: " + consulta.getPaciente().getNombre(), FONT_CUERPO));
        document.add(new Paragraph("Fecha Visita: " + consulta.getFechaVisita().format(FORMATO_FECHA), FONT_CUERPO));
        document.add(new Paragraph("Fecha Emisión: " + java.time.LocalDateTime.now().format(FORMATO_FECHA_HORA), FONT_CUERPO));
        document.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1, 4, 2 });
        table.setHeaderRows(1);
        agregarCeldaHeader(table, "Ctd.");
        agregarCeldaHeader(table, "Descripción");
        agregarCeldaHeader(table, "Precio");

        if (consulta.getDetalles() != null && !consulta.getDetalles().isEmpty()) {
            for (com.dxyop.model.DetalleVenta item : consulta.getDetalles()) {
                agregarCeldaCuerpo(table, String.valueOf(item.getCantidad()) + "x", Element.ALIGN_CENTER);
                String desc = item.getTipoItem() + ": " + item.getDescripcion();
                if ("LENTE".equals(item.getTipoItem())) {
                    if (item.getMaterial() != null) desc += "\nMat: " + item.getMaterial();
                    if (item.getTratamiento() != null) desc += "\nTrat: " + item.getTratamiento();
                }
                agregarCeldaCuerpo(table, desc, Element.ALIGN_LEFT);
                agregarCeldaCuerpo(table, DF.format(item.getSubtotal()), Element.ALIGN_RIGHT);
            }
        }

        document.add(table);
        document.add(Chunk.NEWLINE);
        document.add(new LineSeparator());

        PdfPTable totalesTable = new PdfPTable(2);
        totalesTable.setWidthPercentage(40);
        totalesTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        
        Double totalFinal = consulta.getTotalPresupuesto() != null ? consulta.getTotalPresupuesto() : 0.0;
        Double subtotal = consulta.getSubtotal() != null ? consulta.getSubtotal() : totalFinal;
        boolean aplicaIva = consulta.getAplicarIva() != null && consulta.getAplicarIva();

        if (aplicaIva) {
            Double porcentajeIva = config.getPorcentajeImpuesto() != null ? config.getPorcentajeImpuesto() : 16.0;
            Double montoIva = subtotal * (porcentajeIva / 100.0);

            agregarFilaTotal(totalesTable, "Subtotal:", DF.format(subtotal), FONT_CUERPO);
            agregarFilaTotal(totalesTable, "IVA (" + porcentajeIva + "%):", "+ " + DF.format(montoIva), FONT_CUERPO);
            
            PdfPCell lineaSuma = new PdfPCell(new Phrase(" "));
            lineaSuma.setBorder(Rectangle.BOTTOM);
            lineaSuma.setColspan(2);
            totalesTable.addCell(lineaSuma);
        }

        agregarFilaTotal(totalesTable, "Total:", DF.format(consulta.getTotalPresupuesto() != null ? consulta.getTotalPresupuesto() : 0), FONT_TITULO);
        // Espacio en blanco para separar el pago del total
        PdfPCell espacio = new PdfPCell(new Phrase(" "));
        espacio.setBorder(Rectangle.NO_BORDER);
        espacio.setColspan(2);
        totalesTable.addCell(espacio);

        agregarFilaTotal(totalesTable, "A Cuenta:", DF.format(consulta.getACuenta() != null ? consulta.getACuenta() : 0), FONT_CUERPO);
        agregarFilaTotal(totalesTable, "Restante:", DF.format(consulta.getRestante() != null ? consulta.getRestante() : 0), FONT_CUERPO_BOLD);

        document.add(totalesTable);
        document.add(Chunk.NEWLINE);
        
        Paragraph pFooter = new Paragraph(mensajeFooter, FONT_CUERPO_BOLD);
        pFooter.setAlignment(Element.ALIGN_CENTER);
        document.add(pFooter);

        document.close();
        return out;
    }

    public ByteArrayOutputStream generarReceta(Consulta consulta) throws DocumentException, IOException {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        ConfiguracionGeneral config = getConfig();
        String telefonoOptica = config.getTelefonoPrincipal() != null ? config.getTelefonoPrincipal() : "";
        String direccionOptica = config.getDireccionCorta() != null ? config.getDireccionCorta() : "";

        PdfPTable header = new PdfPTable(3);
        header.setWidthPercentage(100);
        header.setWidths(new float[] { 1, 3, 1 });

        // LOGO IZQUIERDO 
        Image logoIzq = obtenerImagen(config.getLogoRecetaIzq(), "images/logo_ipn.png");
        if(logoIzq != null) {
            logoIzq.scaleToFit(60, 60);
            header.addCell(new PdfPCell(logoIzq) {{ setBorder(Rectangle.NO_BORDER); }});
        } else {
            header.addCell(new PdfPCell() {{ setBorder(Rectangle.NO_BORDER); }});
        }

        Paragraph datosProf = new Paragraph();
        datosProf.add(new Phrase(NOMBRE_PROFESIONAL + "\n", FONT_SUBTITULO));
        datosProf.add(new Phrase("Optometrista\n", FONT_CUERPO));
        datosProf.add(new Phrase("CÉDULA PROFESIONAL: " + CEDULA_PROFESIONAL, FONT_CUERPO_BOLD));
        PdfPCell cellDatos = new PdfPCell(datosProf);
        cellDatos.setBorder(Rectangle.NO_BORDER);
        cellDatos.setHorizontalAlignment(Element.ALIGN_CENTER);
        header.addCell(cellDatos);

        // LOGO DERECHO 
        Image logoDer = obtenerImagen(config.getLogoRecetaDer(), "images/logo_opto.png");
        if(logoDer != null) {
            logoDer.scaleToFit(60, 60);
            header.addCell(new PdfPCell(logoDer) {{ setBorder(Rectangle.NO_BORDER); }});
        } else {
            header.addCell(new PdfPCell() {{ setBorder(Rectangle.NO_BORDER); }});
        }

        document.add(header);
        document.add(new LineSeparator());
        document.add(Chunk.NEWLINE);

        Paciente p = consulta.getPaciente();
        PdfPTable datosPaciente = new PdfPTable(2);
        datosPaciente.setWidthPercentage(100);
        datosPaciente.addCell(new PdfPCell(new Phrase("Paciente: " + p.getNombre(), FONT_CUERPO_BOLD)) {{ setBorder(Rectangle.NO_BORDER); }});
        datosPaciente.addCell(new PdfPCell(new Phrase("Edad: " + (p.getEdad() != null ? p.getEdad() : "-"), FONT_CUERPO)) {{ setBorder(Rectangle.NO_BORDER); setHorizontalAlignment(Element.ALIGN_RIGHT); }});
        datosPaciente.addCell(new PdfPCell(new Phrase("Diagnóstico: " + (consulta.getDiagnosticoOftalmologo() != null ? consulta.getDiagnosticoOftalmologo() : "-"), FONT_CUERPO)) {{ setBorder(Rectangle.NO_BORDER); }});
        datosPaciente.addCell(new PdfPCell(new Phrase("Fecha: " + consulta.getFechaVisita().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), FONT_CUERPO_BOLD)) {{ setBorder(Rectangle.NO_BORDER); setHorizontalAlignment(Element.ALIGN_RIGHT); }});
        document.add(datosPaciente);
        document.add(Chunk.NEWLINE);
        document.add(new LineSeparator());
        document.add(Chunk.NEWLINE);

        Paragraph rxP = new Paragraph("Rx", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24));
        document.add(rxP);

        PdfPTable tablaRx = new PdfPTable(4); 
        tablaRx.setWidthPercentage(80);
        tablaRx.setHorizontalAlignment(Element.ALIGN_LEFT);

        tablaRx.addCell(new PdfPCell(new Phrase("OD:", FONT_CUERPO_BOLD)) {{ setBorder(Rectangle.NO_BORDER); }});
        tablaRx.addCell(new PdfPCell(new Phrase(formatRx(consulta.getSubjetivoOdEsfera()), FONT_RX)) {{ setBorder(Rectangle.NO_BORDER); }});
        tablaRx.addCell(new PdfPCell(new Phrase("= " + formatRx(consulta.getSubjetivoOdCilindro()), FONT_RX)) {{ setBorder(Rectangle.NO_BORDER); }});
        tablaRx.addCell(new PdfPCell(new Phrase("* " + formatRx(consulta.getSubjetivoOdEje()) + "°", FONT_RX)) {{ setBorder(Rectangle.NO_BORDER); }});

        tablaRx.addCell(new PdfPCell(new Phrase("OI:", FONT_CUERPO_BOLD)) {{ setBorder(Rectangle.NO_BORDER); }});
        tablaRx.addCell(new PdfPCell(new Phrase(formatRx(consulta.getSubjetivoOiEsfera()), FONT_RX)) {{ setBorder(Rectangle.NO_BORDER); }});
        tablaRx.addCell(new PdfPCell(new Phrase("= " + formatRx(consulta.getSubjetivoOiCilindro()), FONT_RX)) {{ setBorder(Rectangle.NO_BORDER); }});
        tablaRx.addCell(new PdfPCell(new Phrase("* " + formatRx(consulta.getSubjetivoOiEje()) + "°", FONT_RX)) {{ setBorder(Rectangle.NO_BORDER); }});

        document.add(tablaRx);
        document.add(Chunk.NEWLINE);

        PdfPTable tablaAV = new PdfPTable(2);
        tablaAV.setWidthPercentage(80);
        tablaAV.setHorizontalAlignment(Element.ALIGN_LEFT);

        PdfPTable avCol = new PdfPTable(1);
        avCol.addCell(new PdfPCell(new Phrase("Agudeza Visual (Lejos)", FONT_CUERPO_BOLD)) {{ setBorder(Rectangle.NO_BORDER); }});
        avCol.addCell(new PdfPCell(new Phrase("OD: " + (consulta.getAvNuevaLejosOd() != null ? consulta.getAvNuevaLejosOd() : "-"), FONT_CUERPO)) {{ setBorder(Rectangle.NO_BORDER); }});
        avCol.addCell(new PdfPCell(new Phrase("OI: " + (consulta.getAvNuevaLejosOi() != null ? consulta.getAvNuevaLejosOi() : "-"), FONT_CUERPO)) {{ setBorder(Rectangle.NO_BORDER); }});

        PdfPTable addCol = new PdfPTable(1);
        addCol.addCell(new PdfPCell(new Phrase("Adición / Oblea", FONT_CUERPO_BOLD)) {{ setBorder(Rectangle.NO_BORDER); }});
        addCol.addCell(new PdfPCell(new Phrase("Adición: " + (consulta.getAdicion() != null ? consulta.getAdicion() : "-"), FONT_CUERPO)) {{ setBorder(Rectangle.NO_BORDER); }});
        addCol.addCell(new PdfPCell(new Phrase("Alt. Oblea: " + (consulta.getAlturaOblea() != null ? consulta.getAlturaOblea() : "-"), FONT_CUERPO)) {{ setBorder(Rectangle.NO_BORDER); }});

        tablaAV.addCell(new PdfPCell(avCol) {{ setBorder(Rectangle.NO_BORDER); }});
        tablaAV.addCell(new PdfPCell(addCol) {{ setBorder(Rectangle.NO_BORDER); }});
        document.add(tablaAV);
        document.add(Chunk.NEWLINE);

        if (consulta.getTratamientoMedico() != null && !consulta.getTratamientoMedico().isEmpty()) {
            Paragraph tratamiento = new Paragraph("Tratamiento Médico:\n", FONT_CUERPO_BOLD);
            tratamiento.add(new Phrase(consulta.getTratamientoMedico() + "\n", FONT_CUERPO));
            document.add(tratamiento);
            document.add(Chunk.NEWLINE);
        }

        // Pie de Página dinámico con Redes Sociales
        document.add(Chunk.NEWLINE);
        document.add(new LineSeparator());
        Paragraph footer = new Paragraph();
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.add(new Phrase(telefonoOptica + " | " + direccionOptica + "\n", FONT_CUERPO));
        
        // Cargar redes dinámicas
        String redes = "";
        if(config.getInstagram() != null && !config.getInstagram().isEmpty()) redes += "IG: " + config.getInstagram() + "  ";
        if(config.getFacebook() != null && !config.getFacebook().isEmpty()) redes += "FB: " + config.getFacebook();
        
        if(!redes.isEmpty()) {
            footer.add(new Phrase(redes, FONT_CUERPO));
        }
        
        document.add(footer);

        document.close();
        return out;
    }

    public ByteArrayOutputStream generarEstadoCuenta(Consulta consulta, java.util.List<Pago> pagos) throws DocumentException, IOException {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        ConfiguracionGeneral config = getConfig();
        String nombreOptica = config.getNombreComercial() != null ? config.getNombreComercial() : "Óptica DXY";

        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[] { 1, 2 });

        Image logo = obtenerImagen(config.getLogoSistema(), "images/logo_dxy.png");
        if (logo != null) {
            logo.scaleToFit(80, 80);
            PdfPCell cellLogo = new PdfPCell(logo);
            cellLogo.setBorder(Rectangle.NO_BORDER);
            headerTable.addCell(cellLogo);
        } else {
            headerTable.addCell(new PdfPCell(new Phrase(nombreOptica, FONT_TITULO)));
        }

        Paragraph datosDoc = new Paragraph();
        datosDoc.add(new Phrase("ESTADO DE CUENTA\n", FONT_TITULO));
        datosDoc.add(new Phrase("FOLIO: #" + consulta.getId() + "\n", FONT_SUBTITULO));
        datosDoc.add(new Phrase("Fecha Emisión: " + java.time.LocalDateTime.now().format(FORMATO_FECHA_HORA), FONT_CUERPO));
        PdfPCell cellDatos = new PdfPCell(datosDoc);
        cellDatos.setBorder(Rectangle.NO_BORDER);
        cellDatos.setHorizontalAlignment(Element.ALIGN_RIGHT);
        headerTable.addCell(cellDatos);

        document.add(headerTable);
        document.add(new LineSeparator());
        document.add(Chunk.NEWLINE);

        PdfPTable infoCliente = new PdfPTable(2);
        infoCliente.setWidthPercentage(100);

        PdfPCell colCliente = new PdfPCell();
        colCliente.setBorder(Rectangle.NO_BORDER);
        colCliente.addElement(new Phrase("PACIENTE:", FONT_CUERPO_BOLD));
        colCliente.addElement(new Phrase(consulta.getPaciente().getNombre(), FONT_TITULO));
        colCliente.addElement(new Phrase("Tel: " + (consulta.getPaciente().getTelefono() != null ? consulta.getPaciente().getTelefono() : "-"), FONT_CUERPO));

        PdfPCell colSaldo = new PdfPCell();
        colSaldo.setBorder(Rectangle.NO_BORDER);
        colSaldo.setHorizontalAlignment(Element.ALIGN_RIGHT);

        double total = consulta.getTotalPresupuesto() != null ? consulta.getTotalPresupuesto() : 0.0;
        double pagado = consulta.getACuenta() != null ? consulta.getACuenta() : 0.0;
        double restante = consulta.getRestante() != null ? consulta.getRestante() : 0.0;

        String estado = (restante <= 0.1) ? "PAGADO / LIQUIDADO" : "PENDIENTE DE PAGO";
        Font fontEstado = (restante <= 0.1)
                ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, java.awt.Color.GREEN.darker())
                : FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, java.awt.Color.RED);
        Paragraph pEstado = new Paragraph(estado, fontEstado);
        pEstado.setAlignment(Element.ALIGN_RIGHT);
        colSaldo.addElement(pEstado);

        infoCliente.addCell(colCliente);
        infoCliente.addCell(colSaldo);
        document.add(infoCliente);
        document.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(4); 
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 2, 4, 2, 2 });
        table.setHeaderRows(1);
        agregarCeldaHeader(table, "FECHA");
        agregarCeldaHeader(table, "CONCEPTO / NOTA");
        agregarCeldaHeader(table, "MÉTODO");
        agregarCeldaHeader(table, "IMPORTE");

        if (pagos != null && !pagos.isEmpty()) {
            for (Pago p : pagos) {
                agregarCeldaCuerpo(table, p.getFechaPago().format(FORMATO_FECHA_HORA), Element.ALIGN_CENTER);
                agregarCeldaCuerpo(table, p.getNotas(), Element.ALIGN_LEFT);
                agregarCeldaCuerpo(table, p.getMetodoPago(), Element.ALIGN_CENTER);
                agregarCeldaCuerpo(table, DF.format(p.getMonto()), Element.ALIGN_RIGHT);
            }
        } else {
            PdfPCell cellVacia = new PdfPCell(new Phrase("No hay pagos registrados aún.", FONT_CUERPO));
            cellVacia.setColspan(4);
            cellVacia.setHorizontalAlignment(Element.ALIGN_CENTER);
            cellVacia.setPadding(10);
            table.addCell(cellVacia);
        }
        document.add(table);
        document.add(Chunk.NEWLINE);

        PdfPTable tablaTotales = new PdfPTable(2);
        tablaTotales.setWidthPercentage(45);
        tablaTotales.setHorizontalAlignment(Element.ALIGN_RIGHT);

        //DESGLOSE DE IVA DINÁMICO
        boolean aplicaIva = consulta.getAplicarIva() != null && consulta.getAplicarIva();

        if (aplicaIva) {
            Double subtotal = consulta.getSubtotal() != null ? consulta.getSubtotal() : total;
            Double porcentajeIva = config.getPorcentajeImpuesto() != null ? config.getPorcentajeImpuesto() : 16.0;
            Double montoIva = subtotal * (porcentajeIva / 100.0);

            agregarFilaTotal(tablaTotales, "SUBTOTAL:", DF.format(subtotal), FONT_CUERPO);
            agregarFilaTotal(tablaTotales, "IVA (" + porcentajeIva + "%):", "+ " + DF.format(montoIva), FONT_CUERPO);
        }

        agregarFilaTotal(tablaTotales, "COSTO TOTAL GENERAL:", DF.format(total), FONT_CUERPO_BOLD);
        agregarFilaTotal(tablaTotales, "TOTAL PAGADO:", "- " + DF.format(pagado), FONT_CUERPO);
        
        PdfPCell linea = new PdfPCell(new Phrase(" "));
        linea.setBorder(Rectangle.BOTTOM);
        linea.setColspan(2);
        tablaTotales.addCell(linea);
        agregarFilaTotal(tablaTotales, "SALDO ACTUAL:", DF.format(restante), FONT_TITULO);

        document.add(tablaTotales);

        if (restante <= 0.1) {
            document.add(Chunk.NEWLINE);
            Paragraph liquidado = new Paragraph("¡CUENTA LIQUIDADA! GRACIAS POR SU PAGO.", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, java.awt.Color.DARK_GRAY));
            liquidado.setAlignment(Element.ALIGN_CENTER);
            document.add(liquidado);
        }

        PdfPTable firmas = new PdfPTable(2);
        firmas.setWidthPercentage(80);
        float espacioSeparacion = (restante <= 0.1) ? 20f : 100f;
        firmas.setSpacingBefore(espacioSeparacion);

        PdfPCell f1 = new PdfPCell(new Paragraph("__________________________\nFirma del Paciente", FONT_CUERPO));
        f1.setBorder(Rectangle.NO_BORDER);
        f1.setHorizontalAlignment(Element.ALIGN_CENTER);

        PdfPCell f2 = new PdfPCell(new Paragraph("__________________________\nFirma " + nombreOptica.toUpperCase(), FONT_CUERPO));
        f2.setBorder(Rectangle.NO_BORDER);
        f2.setHorizontalAlignment(Element.ALIGN_CENTER);

        firmas.addCell(f1);
        firmas.addCell(f2);
        document.add(firmas);

        document.close();
        return out;
    }

    private void agregarCeldaHeader(PdfPTable table, String texto) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, FONT_CUERPO_BOLD));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
        table.addCell(cell);
    }

    private void agregarCeldaCuerpo(PdfPTable table, String texto, int alineacion) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, FONT_CUERPO));
        cell.setHorizontalAlignment(alineacion);
        table.addCell(cell);
    }

    private void agregarFilaTotal(PdfPTable table, String etiqueta, String valor, Font fuenteValor) {
        PdfPCell cellEtiqueta = new PdfPCell(new Phrase(etiqueta, FONT_CUERPO_BOLD));
        cellEtiqueta.setBorder(Rectangle.NO_BORDER);
        cellEtiqueta.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(cellEtiqueta);

        PdfPCell cellValor = new PdfPCell(new Phrase(valor, fuenteValor));
        cellValor.setBorder(Rectangle.NO_BORDER);
        cellValor.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(cellValor);
    }

    private String formatRx(String valor) {
        return valor != null ? valor : "0.00";
    }
}