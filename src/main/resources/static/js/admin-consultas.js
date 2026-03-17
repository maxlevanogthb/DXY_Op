const API_CONSULTAS = "/api/consultas";
const API_PRODUCTOS_SEARCH = "/api/productos";
const API_TIPO_PRODUCTO = "/api/tipos-producto";
const API_OPCIONES_LENTE = "/api/opciones-lente";

let catalogoGlobal = [];
let carritoVenta = [];
let configGeneral = { porcentajeImpuesto: 16 };

document.addEventListener("DOMContentLoaded", () => {
  // Esto permite que se pueda escribir en SweetAlert aunque esté sobre un modal de Bootstrap
  const modalConsultaEl = document.getElementById("modalConsulta");
  if (modalConsultaEl) {
    modalConsultaEl.addEventListener("shown.bs.modal", () => {
      // Desactiva la restricción de foco de Bootstrap para este modal
      $(modalConsultaEl).off("focusin.bs.modal");
    });
  }

  // ---CARGAR CONFIGURACIÓN ---
  fetch("/api/configuracion")
    .then((res) => res.json())
    .then((data) => {
      configGeneral = data;
      //console.log("Configuración cargada:", configGeneral);

      // Inyectar el IVA real configurado en la etiqueta del HTML
      const porcentajeIvaBD = configGeneral.porcentajeImpuesto || 0;
      const lblIva = document.getElementById("lblPorcentajeIva");
      if (lblIva) {
        lblIva.textContent = porcentajeIvaBD;
      }
    })
    .catch((err) => console.warn("Error cargando configuración", err));
  const el = document.getElementById("modalHistorial");
  if (el) {
    modalHistorialInstancia = new bootstrap.Modal(el);
  }

  // Cargar datos en segundo plano
  cargarDatosBuscador();
  cargarCatalogosLentes();

  // Listeners Generales de Precios
  const inputsPrecio = document.querySelectorAll(".precio-calc");
  inputsPrecio.forEach((input) => {
    input.addEventListener("input", calcularTotales);
    input.addEventListener("change", calcularTotales);
  });

  // Listeners de Micas 
  ["material", "tratamiento", "tinte"].forEach((id) => {
    const elId = document.getElementById(id);
    if (elId) {
      elId.addEventListener("change", function (e) {
        const opt = e.target.options[e.target.selectedIndex];
        // Usamos || "0" para que si el atributo no existe, valga cero
        const precio = opt.getAttribute("data-precio") || "0";

        const inputId = "precio" + id.charAt(0).toUpperCase() + id.slice(1);
        $("#" + inputId).val(precio);

        // Ejecutamos la suma siempre
        calcularTotales();
      });
    }
  });

  // Listeners Buscador en Cascada
  $("#busqMarca").on("change", filtrarModelos);
  $("#busqModelo").on("change", filtrarColores);
  $("#busqColor").on("change", filtrarTallas);
  $("#busqTalla").on("change", seleccionarProductoFinal);

  // Listeners Botonera Cotizador
  const radiosTipo = document.querySelectorAll('input[name="tipoProducto"]');
  radiosTipo.forEach((radio) => {
    radio.addEventListener("change", function () {
      actualizarInterfazCotizador(this.value);
    });
  });

  // Listener Armazón Propio
  $("#checkArmazonPropio").on("change", function () {
    const esPropio = $(this).is(":checked");
    if (esPropio) {
      $("#contenedorBuscadorInventario").addClass("d-none");
      $("#contenedorArmazonPropio").removeClass("d-none");
      $("#btnQuitarComision").addClass("d-none"); // No hay comisión que quitar

      // Limpiamos los campos
      limpiarCamposFinales();
      $("#armazonModelo").val("Armazón Propio del Paciente");
      $("#armazonModelo").prop("readonly", false); 
    } else {
      $("#contenedorBuscadorInventario").removeClass("d-none");
      $("#contenedorArmazonPropio").addClass("d-none");
      $("#btnQuitarComision").removeClass("d-none");
      $("#armazonModelo").prop("readonly", true);

      filtrarMarcas(); // Recargar el buscador
    }
  });

  // Autogenerar descripción del armazón propio al escribir
  $("#propioMarca, #propioModelo, #propioColor, #propioTipo").on(
    "input change",
    function () {
      const marca = $("#propioMarca").val().trim();
      const modelo = $("#propioModelo").val().trim();
      const color = $("#propioColor").val().trim();
      const tipo = $("#propioTipo").val();

      let desc =
        `[PROPIO] ${marca} ${modelo} ${color ? "- " + color : ""} (${tipo})`.trim();
      if (desc === "[PROPIO] ()") desc = "Armazón Propio del Paciente";

      $("#armazonModelo").val(desc);
    },
  );

  // Listener de Pagos
  $("#aCuenta").on("input change", dibujarCarrito);
  $("#checkAplicarIva").on("change", dibujarCarrito);
});

// ==========================================
// LÓGICA DE NUEVA CONSULTA (Hoja Clínica)
// ==========================================
function abrirModalConsulta(idPaciente, nombrePaciente) {
  // Limpiar rastro de texto
  $("#formConsulta")[0].reset();
  $("#consulta_id").val("");
  $("#consulta_clienteId").val(idPaciente);
  $("#tratamientoMedico").val("");

  // LIMPIEZA DE DINERO 
  $(
    "#precioMaterial, #precioTratamiento, #precioTinte, #precioArmazon, #precioConsulta, #precioServicio",
  ).val("0");

  // Limpiar displays visuales
  if (document.getElementById("displaySubtotalMicas"))
    document.getElementById("displaySubtotalMicas").textContent = "$0.00";

  // Vaciar Carrito
  carritoVenta = [];
  dibujarCarrito();

  // Resetear Interfaz
  $("#cajaEstadoEntrega").addClass("d-none");
  $("#checkArmazonPropio").prop("checked", false).trigger("change");
  $("#checkAplicarIva").prop("checked", false);

  const hoy = new Date().toISOString().split("T")[0];
  $("#fechaVisita").val(hoy);

  $("#optLente").prop("checked", true);
  actualizarInterfazCotizador("LENTE");

  $("#btnGuardarConsulta").removeClass("d-none");
  $("#accionesPostGuardado").addClass("d-none");

  const modalEl = document.getElementById("modalConsulta");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

// ==========================================
// CÁLCULOS (PREVIEW DEL ITEM ACTUAL)
// ==========================================
function calcularTotales() {
  const pMaterial =
    parseFloat(document.getElementById("precioMaterial")?.value) || 0;
  const pTratamiento =
    parseFloat(document.getElementById("precioTratamiento")?.value) || 0;
  const pTinte = parseFloat(document.getElementById("precioTinte")?.value) || 0;

  const subtotalMicas = pMaterial + pTratamiento + pTinte;

  const lblSubtotal = document.getElementById("displaySubtotalMicas");
  if (lblSubtotal) {
    lblSubtotal.textContent = "$" + subtotalMicas.toFixed(2);
  }
}

// ==========================================
// BUSCADOR DE INVENTARIO INTELIGENTE
// ==========================================
async function cargarDatosBuscador() {
  try {
    const resProd = await fetch(API_PRODUCTOS_SEARCH);
    catalogoGlobal = await resProd.json();
    console.log(`Inventario cargado: ${catalogoGlobal.length} productos.`);

    // Iniciamos la interfaz SOLO cuando los datos ya se descargaron
    const tipoInicial =
      $('input[name="tipoProducto"]:checked').val() || "LENTE";
    actualizarInterfazCotizador(tipoInicial);
  } catch (err) {
    console.error("Error cargando buscador:", err);
  }
}

// Función auxiliar para buscar exactamente lo que corresponde a cada pestaña
function coincideCategoria(producto, filtroPrincipal) {
  if (!filtroPrincipal) return true;

  const catFiltro = String(filtroPrincipal).toLowerCase();

  // Extraemos los nombres de forma segura
  const tipoNombre =
    producto && producto.tipo && producto.tipo.nombre
      ? String(producto.tipo.nombre).toLowerCase()
      : "";

  const subTipoNombre =
    producto && producto.subTipo ? String(producto.subTipo).toLowerCase() : "";

  // Pestaña "Lentes" -> Debe mostrar "Armazones" (pero ignorar lentes de contacto)
  if (catFiltro === "lente") {
    return (
      tipoNombre.includes("armaz") ||
      (tipoNombre.includes("lente") && !tipoNombre.includes("contacto"))
    );
  }

  // Pestaña "L. Contacto" -> Muestra solo lentes de contacto
  if (catFiltro === "contacto") {
    return tipoNombre.includes("contacto");
  }

  // Pestaña "Gotas/Líq" -> Muestra gotas o soluciones
  if (catFiltro === "gotas") {
    return (
      tipoNombre.includes("gota") ||
      tipoNombre.includes("líq") ||
      tipoNombre.includes("liq")
    );
  }

  // Default (Accesorios, Reparaciones, etc.)
  return tipoNombre.includes(catFiltro) || subTipoNombre.includes(catFiltro);
}

function filtrarMarcas() {
  const tipoCategoria = $("#busqTipo").val(); 

  resetSelect("busqMarca", "Marca...");
  resetSelect("busqModelo", "Modelo...");
  resetSelect("busqColor", "Color...");
  resetSelect("busqTalla", "Talla...");
  limpiarCamposFinales();

  if (
    !tipoCategoria ||
    tipoCategoria === "CONSULTA" ||
    catalogoGlobal.length === 0
  )
    return;

  const productosDelTipo = catalogoGlobal.filter((p) =>
    coincideCategoria(p, tipoCategoria),
  );

  if (productosDelTipo.length === 0) return;

  const marcas = [...new Set(productosDelTipo.map((p) => p.marca))].sort();
  const select = document.getElementById("busqMarca");
  marcas.forEach((m) => select.add(new Option(m, m)));

  $("#busqMarca").prop("disabled", false);
}

function filtrarModelos() {
  const tipoCategoria = $("#busqTipo").val();
  const marca = $("#busqMarca").val();

  resetSelect("busqModelo", "Modelo...");
  resetSelect("busqColor", "Color...");
  resetSelect("busqTalla", "Talla...");

  if (!marca) return;

  const modelos = [
    ...new Set(
      catalogoGlobal
        .filter((p) => coincideCategoria(p, tipoCategoria) && p.marca === marca)
        .map((p) => p.modelo),
    ),
  ].sort();

  const select = document.getElementById("busqModelo");
  modelos.forEach((m) => select.add(new Option(m, m)));
  $("#busqModelo").prop("disabled", false);
}

function filtrarColores() {
  const tipoCategoria = $("#busqTipo").val();
  const marca = $("#busqMarca").val();
  const modelo = $("#busqModelo").val();

  resetSelect("busqColor", "Color...");
  resetSelect("busqTalla", "Talla...");

  if (!modelo) return;

  let colores = [
    ...new Set(
      catalogoGlobal
        .filter(
          (p) =>
            coincideCategoria(p, tipoCategoria) &&
            p.marca === marca &&
            p.modelo === modelo,
        )
        .map((p) => (p.color && p.color.trim() !== "" ? p.color : "N/A")),
    ),
  ].sort();

  const select = document.getElementById("busqColor");
  colores.forEach((c) => select.add(new Option(c, c)));

  const unicoValor = colores[0];
  const esNA =
    unicoValor === "N/A" ||
    unicoValor === "No Aplica" ||
    unicoValor === "Sin Color";

  if (colores.length === 1 && esNA) {
    select.selectedIndex = 1;
    select.disabled = true;
    filtrarTallas();
  } else {
    select.disabled = false;
  }
}

function filtrarTallas() {
  const tipoCategoria = $("#busqTipo").val();
  const marca = $("#busqMarca").val();
  const modelo = $("#busqModelo").val();
  let color = $("#busqColor").val();

  resetSelect("busqTalla", "Talla...");

  if (!color) return;

  const productos = catalogoGlobal.filter((p) => {
    const pColor = p.color && p.color.trim() !== "" ? p.color : "N/A";
    return (
      coincideCategoria(p, tipoCategoria) &&
      p.marca === marca &&
      p.modelo === modelo &&
      pColor === color
    );
  });

  const select = document.getElementById("busqTalla");
  productos.forEach((p) => {
    const nombreTalla = p.talla && p.talla.trim() !== "" ? p.talla : "Única";
    const opt = new Option(nombreTalla, p.id);
    opt.dataset.precio = p.precioVenta;
    select.add(opt);
  });

  const unicaOpcion = select.options[1] ? select.options[1].text : "";
  const esUnica =
    unicaOpcion === "Única" || unicaOpcion === "N/A" || unicaOpcion === "U";

  if (productos.length === 1 && esUnica) {
    select.selectedIndex = 1;
    select.disabled = true;
    seleccionarProductoFinal();
  } else {
    select.disabled = false;
  }
}

function seleccionarProductoFinal() {
  const prodId = $("#busqTalla").val();
  if (!prodId) return;

  const producto = catalogoGlobal.find((p) => p.id == prodId);

  if (producto) {
    $("#selectProducto").val(producto.id);

    const tipoNombre =
      producto.tipo && typeof producto.tipo === "object"
        ? producto.tipo.nombre
        : producto.tipo;
    let desc = `${tipoNombre} ${producto.marca} ${producto.modelo}`;

    if (
      producto.color &&
      producto.color !== "N/A" &&
      producto.color !== "No Aplica"
    ) {
      desc += ` - ${producto.color}`;
    }
    if (
      producto.talla &&
      producto.talla !== "Única" &&
      producto.talla !== "N/A"
    ) {
      desc += ` (${producto.talla})`;
    }

    $("#armazonModelo").val(desc);
    $("#precioArmazon").val(producto.precioVenta || 0);

    calcularTotales();

    $("#armazonModelo").addClass("bg-success text-white");
    setTimeout(
      () => $("#armazonModelo").removeClass("bg-success text-white"),
      500,
    );
  }
}

function resetSelect(id, placeholder) {
  const s = document.getElementById(id);
  if (s) {
    s.innerHTML = `<option value="">${placeholder}</option>`;
    s.disabled = true;
  }
}

function limpiarCamposFinales() {
  $("#armazonModelo").val("-");
  $("#precioArmazon").val("0.00");
  $("#selectProducto").val("");
  calcularTotales();
}

// ==========================================
// CATÁLOGOS MICAS
// ==========================================
function cargarCatalogosLentes() {
  const llenarSelect = (categoria, selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;

    fetch(`${API_OPCIONES_LENTE}?categoria=${categoria}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        select.innerHTML =
          '<option value="" data-precio="0">Seleccionar...</option>';
        data.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.nombre;
          option.text = item.nombre;
          option.setAttribute("data-precio", item.precioBase || 0);
          select.appendChild(option);
        });
        select.disabled = false;
      })
      .catch(console.warn);
  };

  llenarSelect("MATERIAL", "material");
  llenarSelect("TRATAMIENTO", "tratamiento");
  llenarSelect("TINTE", "tinte");
}

// ==========================================
// LÓGICA DE INTERFAZ DEL COTIZADOR
// ==========================================
function actualizarInterfazCotizador(tipo) {
  $("#panelMicas").addClass("d-none");
  $("#panelInventario").addClass("d-none");
  $("#panelConsulta").addClass("d-none");
  $("#panelServicios").addClass("d-none"); 

  $("#opcionArmazonPropio").addClass("d-none");
  $("#checkArmazonPropio").prop("checked", false).trigger("change");

  switch (tipo) {
    case "CONSULTA":
      $("#panelConsulta").removeClass("d-none");
      $("#precioConsulta").focus();
      $("#busqTipo").val("CONSULTA");
      break;

    case "SERVICIO":
      $("#panelServicios").removeClass("d-none");
      $("#descServicio").focus();
      $("#busqTipo").val("SERVICIO");
      break;

    case "LENTE":
      $("#panelMicas").removeClass("d-none");
      $("#panelInventario").removeClass("d-none");
      $("#tituloInventario").html(
        '<i class="fas fa-glasses me-1"></i> SELECCIONAR ARMAZÓN',
      );
      $("#busqTipo").val("LENTE");
      $("#opcionArmazonPropio").removeClass("d-none"); 
      filtrarMarcas();
      break;

    case "CONTACTO":
      $("#panelInventario").removeClass("d-none");
      $("#tituloInventario").html(
        '<i class="fas fa-eye me-1"></i> LENTES DE CONTACTO',
      );
      $("#busqTipo").val("CONTACTO");
      filtrarMarcas();
      break;

    case "GOTAS":
      $("#panelInventario").removeClass("d-none");
      $("#tituloInventario").html(
        '<i class="fas fa-tint me-1"></i> LÍQUIDOS/CUIDADO OCULAR',
      );
      $("#busqTipo").val("GOTAS");
      filtrarMarcas();
      break;

    case "ACCESORIO":
      $("#panelInventario").removeClass("d-none");
      $("#tituloInventario").html(
        '<i class="fas fa-spray-can me-1"></i> ACCESORIOS',
      );
      $("#busqTipo").val("ACCESORIO");
      filtrarMarcas();
      break;
  }
}

// EVENTOS DEL ARMAZÓN PROPIO
$(document).ready(function () {
  $("#checkArmazonPropio").on("change", function () {
    const esPropio = $(this).is(":checked");
    if (esPropio) {
      $("#contenedorBuscadorInventario").addClass("d-none");
      $("#contenedorArmazonPropio").removeClass("d-none");
      $("#btnQuitarComision").addClass("d-none");
      limpiarCamposFinales();
      $("#armazonModelo").val("Armazón Propio del Paciente");
      $("#armazonModelo").prop("readonly", false);
    } else {
      $("#contenedorBuscadorInventario").removeClass("d-none");
      $("#contenedorArmazonPropio").addClass("d-none");
      $("#btnQuitarComision").removeClass("d-none");
      $("#armazonModelo").prop("readonly", true);
      filtrarMarcas();
    }
  });

  $(
    "#propioMarca, #propioModelo, #propioColor, #propioTipo, #propioCondicion",
  ).on("input change", function () {
    const marca = $("#propioMarca").val().trim();
    const modelo = $("#propioModelo").val().trim();
    const desc =
      `[PROPIO] ${marca} ${modelo} (${$("#propioTipo").val()})`.trim();
    $("#armazonModelo").val(
      desc === "[PROPIO] ()" ? "Armazón Propio del Paciente" : desc,
    );
  });
});

// ==========================================
// CARRITO DE COMPRAS (Validación Estricta)
// ==========================================
function agregarItemAlCarrito() {
  const tipo = $('input[name="tipoProducto"]:checked').val();
  let item = null;

  if (tipo === "CONSULTA") {
    const precio = parseFloat($("#precioConsulta").val()) || 0;
    if (precio <= 0) {
      Swal.fire("Atención", "Ingrese el costo de la consulta.", "warning");
      return;
    }
    item = {
      tipoItem: "CONSULTA",
      descripcion: "Consulta / Examen",
      cantidad: 1,
      precioUnitario: precio,
      subtotal: precio,
      material: null,
      tratamiento: null,
      tinte: null,
      productoInventarioId: null,
    };
  } else if (tipo === "SERVICIO") {
    const desc = $("#descServicio").val().trim();
    const precio = parseFloat($("#precioServicio").val()) || 0;
    if (!desc || precio <= 0) {
      Swal.fire(
        "Atención",
        "Ingrese la descripción y el costo de la reparación.",
        "warning",
      );
      return;
    }
    item = {
      tipoItem: "SERVICIO",
      descripcion: `Reparación: ${desc}`,
      cantidad: 1,
      precioUnitario: precio,
      subtotal: precio,
      material: null,
      tratamiento: null,
      tinte: null,
      productoInventarioId: null,
    };
  } else {
    const esPropio = $("#checkArmazonPropio").is(":checked");
    const precioInv = parseFloat($("#precioArmazon").val()) || 0;
    let descripcion = $("#armazonModelo").val();

    // VALIDACIÓN 1: Armazón
    if (
      !esPropio &&
      (!descripcion || descripcion === "" || descripcion === "-")
    ) {
      Swal.fire(
        "¡Falta el Armazón!",
        "Seleccione un producto del inventario.",
        "warning",
      );
      return;
    }
    if (esPropio && (!$("#propioMarca").val() || !$("#propioModelo").val())) {
      Swal.fire(
        "¡Datos Incompletos!",
        "Indique la Marca y Modelo del armazón que trae el paciente.",
        "warning",
      );
      return;
    }

    const mat = $("#material").val();
    const trat = $("#tratamiento").val();
    const tinte = $("#tinte").val();
    const precioMicas =
      tipo === "LENTE"
        ? (parseFloat($("#precioMaterial").val()) || 0) +
          (parseFloat($("#precioTratamiento").val()) || 0) +
          (parseFloat($("#precioTinte").val()) || 0)
        : 0;

    // VALIDACIÓN 2: Micas obligatorias para Lentes
    if (tipo === "LENTE") {
      if (!mat) {
        Swal.fire(
          "¡Faltan las Micas!",
          "Debe seleccionar un Material para el lente (o crear una opción 'Sin Mica').",
          "warning",
        );
        return;
      }
      descripcion += ` + Mica ${mat} ${trat ? `(${trat})` : ""} ${tinte ? `[Tinte: ${tinte}]` : ""}`;
    }

    const subtotal = precioInv + precioMicas;
    let notasExtras = null;
    if (esPropio)
      notasExtras = `Armazón Propio: ${$("#propioMarca").val()} ${$("#propioModelo").val()} | Condición: ${$("#propioCondicion").val()}`;

    item = {
      tipoItem: tipo,
      descripcion: descripcion,
      cantidad: 1,
      precioUnitario: subtotal,
      subtotal: subtotal,
      material: tipo === "LENTE" ? mat : null,
      tratamiento: tipo === "LENTE" ? trat : null,
      tinte: tipo === "LENTE" ? tinte : null,
      productoInventarioId:
        !esPropio && $("#selectProducto").val()
          ? parseInt($("#selectProducto").val())
          : null,
      notas: notasExtras,
    };
  }

  carritoVenta.push(item);
  dibujarCarrito();
  Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
  }).fire({ icon: "success", title: "Agregado a la venta" });

  // Limpieza general
  if (tipo === "CONSULTA") $("#precioConsulta").val("0.00");
  else if (tipo === "SERVICIO") {
    $("#descServicio").val("");
    $("#precioServicio").val("");
  } else {
    $("#armazonModelo").val("");
    $("#precioArmazon").val("0.00");
    $("#selectProducto").val("");
    $("#propioMarca").val("");
    $("#propioModelo").val("");
    $("#propioColor").val("");
    $("#propioCondicion").val("");
    $("#material").val("").trigger("change");
    $("#tratamiento").val("").trigger("change");
    $("#tinte").val("").trigger("change");
    calcularTotales();
  }
}

function dibujarCarrito() {
  const tbody = $("#carritoBody");
  tbody.empty();

  let sumaArticulos = 0; // Este es el SUBTOTAL puro

  carritoVenta.forEach((item, index) => {
    sumaArticulos += item.subtotal;

    let badgeColor = "bg-secondary";
    if (item.tipoItem === "LENTE") badgeColor = "bg-primary";
    if (item.tipoItem === "CONSULTA") badgeColor = "bg-info text-dark";
    if (item.tipoItem === "ACCESORIO") badgeColor = "bg-warning text-dark";
    if (item.tipoItem === "GOTAS") badgeColor = "bg-success";
    if (item.tipoItem === "SERVICIO") badgeColor = "bg-warning text-dark";

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="small align-middle">${item.descripcion}</td>
            <td class="text-center align-middle"><span class="badge ${badgeColor}">${item.tipoItem}</span></td>
            <td class="text-end align-middle fw-bold">$${item.subtotal.toFixed(2)}</td>
            <td class="text-center align-middle">
                <button type="button" class="btn btn-sm text-danger px-2" onclick="eliminarItemCarrito(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
    tbody.append(tr);
  });

  if (carritoVenta.length === 0) {
    tbody.append(
      '<tr><td colspan="4" class="text-center text-muted py-3 small"><i class="fas fa-shopping-basket mb-1 fs-5 d-block"></i>Lista vacía</td></tr>',
    );
  }

  const aplicarIva = $("#checkAplicarIva").is(":checked");
  // Extraemos el IVA de tu configuración de BD
  const porcentajeIva = configGeneral.porcentajeImpuesto || 0;

  let montoIva = 0;

  if (aplicarIva) {
    // El doctor activó el switch: Calculamos el impuesto
    montoIva = sumaArticulos * (porcentajeIva / 100);
    $("#filaIva").removeClass("d-none"); // Mostramos la fila del desglose
    $("#lblPorcentajeIva").text(porcentajeIva);
  } else {
    $("#filaIva").addClass("d-none"); // Ocultamos el IVA si está apagado
  }

  const totalFinal = sumaArticulos + montoIva;

  // Actualizamos los displays de texto
  $("#displaySubtotalVenta").text("$" + sumaArticulos.toFixed(2));
  $("#displayMontoIva").text("+$" + montoIva.toFixed(2));
  $("#displayTotal").text("$" + totalFinal.toFixed(2));

  // Actualizamos la variable oculta que se envía a Java
  $("#totalPresupuesto").val(totalFinal.toFixed(2));

  // --- MATEMÁTICA DE LA DEUDA ---
  const aCuenta = parseFloat($("#aCuenta").val()) || 0;
  let restante = totalFinal - aCuenta;

  // Evitar valores negativos si el cliente da más de anticipo (cambio)
  if (restante < 0) restante = 0;

  $("#restante").val(restante.toFixed(2));
  $("#displayRestante").text("$" + restante.toFixed(2));

  const elRestante = document.getElementById("displayRestante");
  if (elRestante) {
    if (restante > 0.1) elRestante.className = "text-danger fw-bold mb-0";
    else elRestante.className = "text-success fw-bold mb-0"; // Se pinta verde si ya liquidó
  }
}

function eliminarItemCarrito(index) {
  carritoVenta.splice(index, 1);
  dibujarCarrito();
}

// ==========================================
//GUARDAR Y CARGAR DATOS 
// ==========================================
function guardarConsulta() {
  const clienteId = $("#consulta_clienteId").val();

  if (!clienteId) {
    Swal.fire("Atención", "Seleccione un paciente.", "warning");
    return;
  }

  const subtotalIngresado =
    parseFloat($("#displaySubtotalVenta").text().replace("$", "")) || 0;
  const aplicaIva = $("#checkAplicarIva").is(":checked");

  const anticipoIngresado = parseFloat($("#aCuenta").val()) || 0;
  const totalPresupuesto = parseFloat($("#totalPresupuesto").val()) || 0;
  const restanteCalculado = parseFloat($("#restante").val()) || 0;

  const consultaDto = {
    clienteId: parseInt(clienteId),
    detalles: carritoVenta,

    fechaVisita:
      $("#fechaVisita").val() || new Date().toISOString().split("T")[0],
    razonVisita: $("#razonVisita").val(),
    antecedentesClinicos: $("#antecedentesClinicos").val(),
    diagnosticoOftalmologo: $("#diagnosticoOftalmologo").val(),
    tratamientoMedico: $("#tratamientoMedico").val(),

    estadoEntrega: $("#cajaEstadoEntrega").hasClass("d-none")
      ? null
      : $("#estadoEntrega").val(),

    avLejosOd: $("#avSinLejosOD").val(),
    avLejosOi: $("#avSinLejosOI").val(),
    avCercaOd: $("#avSinCercaOD").val(),
    avCercaOi: $("#avSinCercaOI").val(),

    avActualLejosOd: $("#avActualLejosOD").val(),
    avActualLejosOi: $("#avActualLejosOI").val(),
    avActualCercaOd: $("#avActualCercaOD").val(),
    avActualCercaOi: $("#avActualCercaOI").val(),

    avNuevaLejosOd: $("#avNuevaLejosOD").val(),
    avNuevaLejosOi: $("#avNuevaLejosOI").val(),
    avNuevaCercaOd: $("#avNuevaCercaOD").val(),
    avNuevaCercaOi: $("#avNuevaCercaOI").val(),

    capacidadVisualOd: $("#capacidadOD").val(),
    capacidadVisualOi: $("#capacidadOI").val(),

    brutaOdEsfera: $("#brutaOdEsfera").val(),
    brutaOdCilindro: $("#brutaOdCilindro").val(),
    brutaOdEje: $("#brutaOdEje").val(),

    brutaOiEsfera: $("#brutaOiEsfera").val(),
    brutaOiCilindro: $("#brutaOiCilindro").val(),
    brutaOiEje: $("#brutaOiEje").val(),

    subjetivoOdEsfera: $("#subjetivoOdEsfera").val(),
    subjetivoOdCilindro: $("#subjetivoOdCilindro").val(),
    subjetivoOdEje: $("#subjetivoOdEje").val(),

    subjetivoOiEsfera: $("#subjetivoOiEsfera").val(),
    subjetivoOiCilindro: $("#subjetivoOiCilindro").val(),
    subjetivoOiEje: $("#subjetivoOiEje").val(),

    adicion: $("#adicion").val(),
    alturaOblea: $("#alturaOblea").val(),
    dip: $("#dip").val(),

    subtotal: subtotalIngresado,
    aplicarIva: aplicaIva,
    totalPresupuesto: totalPresupuesto,
    aCuenta: 0,
    restante: restanteCalculado,
  };

  const idConsulta = $("#consulta_id").val();
  const method = idConsulta ? "PUT" : "POST";
  const url = API_CONSULTAS + (idConsulta ? "/" + idConsulta : "");

  fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(consultaDto),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Error de servidor");
      return res.json();
    })
    .then((consultaGuardada) => {
      if (method === "POST" && anticipoIngresado > 0) {
        return fetch("/api/pagos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consultaId: consultaGuardada.id,
            monto: anticipoIngresado,
            metodoPago: "Efectivo",
            notas: "Anticipo - Apertura",
            fechaPago: new Date().toISOString(),
          }),
        }).then(() => consultaGuardada);
      }
      return consultaGuardada;
    })
    .then((data) => {
      $("#consulta_id").val(data.id);

      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Guardado correctamente.",
        timer: 2500,
        showConfirmButton: false,
      });

      $("#btnGuardarConsulta").addClass("d-none");
      $("#accionesPostGuardado").removeClass("d-none");

      if (typeof dataTable !== "undefined") {
        dataTable.ajax.reload(null, false);
      }

      carritoVenta = [];
      dibujarCarrito();
    })
    .catch((err) => {
      Swal.fire("Error", err.message, "error");
    });
}

function cargarConsultaParaEditar(consultaId) {
  if (modalHistorialInstancia) {
    modalHistorialInstancia.hide();
  }

  Swal.fire({
    title: "Cargando...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  fetch(`${API_CONSULTAS}/${consultaId}`)
    .then((res) => {
      if (!res.ok) throw new Error("No se pudo conectar con el servidor.");
      return res.json();
    })
    .then((data) => {
      Swal.close();

      // Limpiar formulario
      $("#formConsulta")[0].reset();

      // Asignar IDs 
      $("#consulta_id").val(data.id);
      if (data.paciente && data.paciente.id) {
        $("#consulta_clienteId").val(data.paciente.id);
      } else if (data.cliente && data.cliente.id) {
        // Por si JSON lo manda como "cliente" en lugar de "paciente"
        $("#consulta_clienteId").val(data.cliente.id);
      }

      // Datos Generales
      $("#fechaVisita").val(data.fechaVisita || "");
      $("#razonVisita").val(data.razonVisita || "");
      $("#antecedentesClinicos").val(data.antecedentesClinicos || "");
      $("#diagnosticoOftalmologo").val(data.diagnosticoOftalmologo || "");
      $("#tratamientoMedico").val(data.tratamientoMedico || "");

      // Estado de Entrega
      $("#cajaEstadoEntrega").removeClass("d-none");
      $("#estadoEntrega").val(data.estadoEntrega || "NO_APLICA");

      // Datos de Refracción y Agudeza Visual 
      $("#avSinLejosOD").val(data.avLejosOd || "");
      $("#avSinLejosOI").val(data.avLejosOi || "");
      $("#avSinCercaOD").val(data.avCercaOd || "");
      $("#avSinCercaOI").val(data.avCercaOi || "");

      $("#avActualLejosOD").val(data.avActualLejosOd || "");
      $("#avActualLejosOI").val(data.avActualLejosOi || "");
      $("#avActualCercaOD").val(data.avActualCercaOd || "");
      $("#avActualCercaOI").val(data.avActualCercaOi || "");

      $("#avNuevaLejosOD").val(data.avNuevaLejosOd || "");
      $("#avNuevaLejosOI").val(data.avNuevaLejosOi || "");
      $("#avNuevaCercaOD").val(data.avNuevaCercaOd || "");
      $("#avNuevaCercaOI").val(data.avNuevaCercaOi || "");

      $("#capacidadOD").val(data.capacidadVisualOd || "");
      $("#capacidadOI").val(data.capacidadVisualOi || "");

      $("#brutaOdEsfera").val(data.brutaOdEsfera || "");
      $("#brutaOdCilindro").val(data.brutaOdCilindro || "");
      $("#brutaOdEje").val(data.brutaOdEje || "");

      $("#brutaOiEsfera").val(data.brutaOiEsfera || "");
      $("#brutaOiCilindro").val(data.brutaOiCilindro || "");
      $("#brutaOiEje").val(data.brutaOiEje || "");

      $("#subjetivoOdEsfera").val(data.subjetivoOdEsfera || "");
      $("#subjetivoOdCilindro").val(data.subjetivoOdCilindro || "");
      $("#subjetivoOdEje").val(data.subjetivoOdEje || "");

      $("#subjetivoOiEsfera").val(data.subjetivoOiEsfera || "");
      $("#subjetivoOiCilindro").val(data.subjetivoOiCilindro || "");
      $("#subjetivoOiEje").val(data.subjetivoOiEje || "");

      $("#adicion").val(data.adicion || "");
      $("#alturaOblea").val(data.alturaOblea || "");
      $("#dip").val(data.dip || "");

      // Reconstruimos el Carrito
      if (data.detalles && data.detalles.length > 0) {
        carritoVenta = data.detalles;
      } else {
        carritoVenta = [];
        // Compatibilidad vieja
        if (
          data.armazonModelo &&
          data.armazonModelo !== "Solo Consulta / Sin Producto"
        ) {
          carritoVenta.push({
            tipoItem: "LENTE",
            descripcion: data.armazonModelo,
            subtotal: data.precioArmazon || 0,
            material: data.material,
            tratamiento: data.tratamiento,
            tinte: data.tinte,
          });
        }
      }

      // DATOS FINANCIEROS (V2.0)
      // Aseguramos que el switch se prenda si la base de datos dice "true"
      $("#checkAplicarIva").prop("checked", data.aplicarIva === true);
      $("#aCuenta").val(data.aCuenta || 0);

      // Dibujar Carrito (esto también dispara el cálculo de totales e IVA en pantalla)
      dibujarCarrito();

      // Configuración Final de Interfaz
      $("#btnGuardarConsulta").removeClass("d-none");
      $("#accionesPostGuardado").removeClass("d-none");

      new bootstrap.Modal(document.getElementById("modalConsulta")).show();
    })
    .catch((error) => {
      console.error("ERROR CRÍTICO AL CARGAR CONSULTA:", error);
      Swal.fire({
        icon: "error",
        title: "Error de lectura",
        text: "Algo falló al procesar los datos: " + error.message,
      });
    });
}

// ==========================================
// IMPRESIÓN Y RUTINAS TABLA PACIENTES
// ==========================================
function imprimirDocumento(tipo) {
  window.open(
    `/imprimir/${tipo}/${$("#consulta_id").val()}`,
    "PDF",
    "width=1000,height=800",
  );
}

function imprimirDesdeHistorial(id, tipo) {
  window.open(`/imprimir/${tipo}/${id}`, "PDF", "width=1000,height=800");
}

function abrirHistorial(clienteId, nombrePaciente) {
  document.getElementById("historialPacienteNombre").textContent =
    nombrePaciente;
  const tbody = document.getElementById("tablaHistorialBody");
  const msg = document.getElementById("sinHistorialMsg");

  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center py-3 text-secondary"><i class="fas fa-spinner fa-spin me-2"></i>Cargando historial...</td></tr>';
  msg.classList.add("d-none");

  if (modalHistorialInstancia) {
    modalHistorialInstancia.show();
  }

  fetch(`/api/consultas/cliente/${clienteId}`)
    .then((res) => {
      if (res.status === 204) return [];
      return res.json();
    })
    .then((consultas) => {
      tbody.innerHTML = "";

      if (consultas.length === 0) {
        msg.classList.remove("d-none");
        return;
      }

      consultas.forEach((c) => {
        const fecha = new Date(
          c.fechaVisita + "T00:00:00",
        ).toLocaleDateString();
        const total = parseFloat(c.totalPresupuesto || 0).toFixed(2);

        // --- LÓGICA DE ESTADO DE ENTREGA ---
        let badgeEstado =
          '<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">No Aplica</span>';

        if (c.estadoEntrega === "PENDIENTE") {
          badgeEstado =
            '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger"><i class="fas fa-clock me-1"></i>Pendiente</span>';
        } else if (c.estadoEntrega === "RECIBIDO") {
          badgeEstado =
            '<span class="badge bg-warning bg-opacity-10 text-dark border border-warning"><i class="fas fa-box me-1"></i>Recibido</span>';
        } else if (c.estadoEntrega === "ENTREGADO") {
          badgeEstado =
            '<span class="badge bg-success bg-opacity-10 text-success border border-success"><i class="fas fa-check me-1"></i>Entregado</span>';
        }

        // --- CREACIÓN DE LA FILA ---
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="align-middle">${fecha}</td>
            <td class="align-middle">${c.razonVisita || "-"}</td>
            <td class="small text-muted align-middle text-truncate" style="max-width: 150px;">${c.diagnosticoOftalmologo || "Sin diagnóstico"}</td>
            
            <td class="text-center align-middle">${badgeEstado}</td>
            
            <td class="text-end fw-bold align-middle">$${total}</td>
            <td class="text-center align-middle">
                <div class="btn-group btn-group-sm shadow-sm">
                    <button class="btn btn-warning text-dark px-2" title="Editar / Actualizar Estado" onclick="cargarConsultaParaEditar(${c.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-secondary px-2" title="Imprimir Receta Médica" onclick="imprimirDesdeHistorial(${c.id}, 'receta')">
                        <i class="fas fa-file-prescription"></i>
                    </button>
                    <button class="btn btn-outline-primary px-2" title="Imprimir Recibo de Venta" onclick="imprimirDesdeHistorial(${c.id}, 'recibo')">
                        <i class="fas fa-receipt"></i>
                    </button>
                    <button class="btn btn-outline-dark px-2" title="Estado de Cuenta / Pagos" onclick="imprimirDesdeHistorial(${c.id}, 'estado-cuenta')">
                        <i class="fas fa-file-invoice-dollar"></i>
                    </button>
                    <button class="btn btn-outline-danger px-2 ms-1" title="Eliminar Hoja Clínica" onclick="eliminarConsultaDeHistorial(${c.id}, ${clienteId}, '${nombrePaciente}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(() => {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-danger py-3"><i class="fas fa-exclamation-triangle me-2"></i>Error al cargar el historial</td></tr>';
    });
}

function enviarReciboPorCorreo(idConsulta) {
  Swal.fire({
    title: "Enviar Recibo por Correo",
    input: "email",
    inputLabel: "Correo electrónico del paciente",
    inputPlaceholder: "ejemplo@correo.com",
    showCancelButton: true,
    confirmButtonText: '<i class="fas fa-paper-plane me-1"></i> Enviar',
    cancelButtonText: "Cancelar",
    showLoaderOnConfirm: true,
    preConfirm: (correo) => {
      if (!correo) {
        Swal.showValidationMessage("Por favor ingrese un correo");
        return false;
      }
      return fetch(`/api/correos/enviar-recibo/${idConsulta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correo }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((err) => {
              throw new Error(err.error || "Error al enviar");
            });
          }
          return response.json();
        })
        .catch((error) => {
          Swal.showValidationMessage(`Error: ${error.message}`);
        });
    },
    allowOutsideClick: () => !Swal.isLoading(),
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        icon: "success",
        title: "¡Enviado!",
        text: "El recibo ha sido enviado al correo del paciente.",
        timer: 2500,
        showConfirmButton: false,
      });
    }
  });
}

// ==========================================
// CREACIÓN IN-SITU: CATÁLOGOS CLÍNICOS (Micas)
// ==========================================
function crearLenteInSitu(
  categoriaClinica,
  selectId,
  modalId = "modalConsulta",
) {
  const nombreBonito =
    categoriaClinica.charAt(0) + categoriaClinica.slice(1).toLowerCase();

  Swal.fire({
    title: `Nuevo ${nombreBonito}`,
    width: "600px",
    target: document.getElementById(modalId),
    html: `
            <div class="text-start mt-3">
                <div class="mb-3">
                    <label class="form-label fw-bold small">Descripción / Nombre *</label>
                    <input type="text" id="swal-lente-nombre" class="form-control" placeholder="Ej. Policarbonato HD">
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-4">
                        <label class="form-label fw-bold small">Costo *</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-body-tertiary">$</span>
                            <input type="number" id="swal-lente-costo" class="form-control" placeholder="0.00">
                        </div>
                    </div>
                    <div class="col-4">
                        <label class="form-label fw-bold small text-info">Comisión</label>
                        <div class="input-group input-group-sm">
                            <input type="number" id="swal-lente-comision" class="form-control border-info" value="${configGeneral.porcentajeComisionTarjeta || 0}">
                            <span class="input-group-text bg-info text-white border-info">%</span>
                        </div>
                    </div>
                    <div class="col-4">
                        <label class="form-label fw-bold small text-success">P. Venta</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-success text-white border-success">$</span>
                            <input type="number" id="swal-lente-precio" class="form-control border-success text-success fw-bold" placeholder="0.00">
                        </div>
                    </div>
                </div>
            </div>
        `,
    showCancelButton: true,
    confirmButtonColor: "#212529",
    confirmButtonText: '<i class="fas fa-save"></i> Guardar',
    cancelButtonText: "Cancelar",

    didOpen: () => {
      const inputCosto = document.getElementById("swal-lente-costo");
      const inputComision = document.getElementById("swal-lente-comision");
      const inputPrecio = document.getElementById("swal-lente-precio");

      const calcularDesdeComision = () => {
        const costo = parseFloat(inputCosto.value) || 0;
        const comision = parseFloat(inputComision.value) || 0;
        if (costo > 0)
          inputPrecio.value = (costo * (1 + comision / 100)).toFixed(2);
        else inputPrecio.value = "";
      };

      const calcularDesdePrecio = () => {
        const costo = parseFloat(inputCosto.value) || 0;
        const precio = parseFloat(inputPrecio.value) || 0;
        if (costo > 0 && precio >= costo)
          inputComision.value = ((precio / costo - 1) * 100).toFixed(2);
        else inputComision.value = 0;
      };

      inputCosto.addEventListener("input", calcularDesdeComision);
      inputComision.addEventListener("input", calcularDesdeComision);
      inputPrecio.addEventListener("input", calcularDesdePrecio);
    },
    preConfirm: () => {
      const nombre = document.getElementById("swal-lente-nombre").value.trim();
      const costo = document.getElementById("swal-lente-costo").value;
      const comision = document.getElementById("swal-lente-comision").value;
      const precio = document.getElementById("swal-lente-precio").value;

      if (!nombre || !costo || !precio) {
        Swal.showValidationMessage(
          "El nombre, costo y precio son obligatorios",
        );
        return false;
      }
      return {
        categoria: categoriaClinica,
        nombre: nombre,
        precioCosto: parseFloat(costo) || 0,
        porcentajeComision: parseFloat(comision) || 0,
        precioBase: parseFloat(precio) || 0,
      };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/api/opciones-lente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.value),
      })
        .then((res) => res.json())
        .then((nuevaOpcion) => {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Agregado al catálogo",
            showConfirmButton: false,
            timer: 2000,
            target: document.getElementById(modalId), 
          });

          const selectElement = document.getElementById(selectId);
          if (selectElement) {
            const option = new Option(nuevaOpcion.nombre, nuevaOpcion.nombre);
            option.dataset.precio = nuevaOpcion.precioBase;
            selectElement.add(option);
            selectElement.value = nuevaOpcion.nombre;
            calcularTotales();
          }
        })
        .catch((err) =>
          Swal.fire({
            title: "Error",
            text: "No se pudo guardar",
            icon: "error",
            target: document.getElementById(modalId),
          }),
        );
    }
  });
}

// ==========================================
// CREACIÓN IN-SITU: PRODUCTOS RÁPIDOS (CATEGORÍAS Y ESTILOS DINÁMICOS)
// ==========================================
function crearProductoRapidoInSitu() {
  const tabActiva = $('input[name="tipoProducto"]:checked').val() || "LENTE";

  let catMarcas = "MARCA_ARMAZON";
  if (tabActiva === "CONTACTO") catMarcas = "MARCA_CONTACTO";

  Promise.all([
    fetch("/api/tipos-producto").then((res) => res.json()),
    fetch(`/api/opciones-lente?categoria=${catMarcas}`).then((res) =>
      res.json(),
    ),
    fetch("/api/opciones-lente?categoria=TIPO_ARMAZON").then((res) =>
      res.json(),
    ),
  ]).then(([tiposTotales, marcas, estilos]) => {
    // Filtramos las categorías para que correspondan a la pestaña actual
    const tiposFiltrados = tiposTotales.filter((t) => {
      const nom = t.nombre.toLowerCase();
      if (tabActiva === "LENTE") return nom.includes("armaz");
      if (tabActiva === "CONTACTO") return nom.includes("contacto");
      if (tabActiva === "GOTAS")
        return nom.includes("gota") || nom.includes("liq");
      if (tabActiva === "ACCESORIO") return nom.includes("accesorio");
      return true;
    });

    let opcionesCategoria = "";
    tiposFiltrados.forEach(
      (t) =>
        (opcionesCategoria += `<option value="${t.id}">${t.nombre}</option>`),
    );

    let opcionesMarcas = '<option value="">Seleccionar marca...</option>';
    marcas.forEach(
      (m) =>
        (opcionesMarcas += `<option value="${m.nombre}">${m.nombre}</option>`),
    );

    let opcionesEstilo = '<option value="">Seleccionar estilo...</option>';
    estilos.forEach(
      (e) =>
        (opcionesEstilo += `<option value="${e.nombre}">${e.nombre}</option>`),
    );

    Swal.fire({
      title: "Alta Rápida de Producto",
      target: document.getElementById("modalConsulta"),
      width: "650px",
      html: `
        <div class="text-start mt-2">
            <div class="row g-2 mb-3">
                <div class="col-sm-6">
                    <label class="form-label fw-bold small">Categoría *</label>
                    <div class="input-group input-group-sm">
                        <select id="swal-prod-cat" class="form-select">${opcionesCategoria}</select>
                        <input type="text" id="swal-new-cat" class="form-control d-none" placeholder="Ej. Armazón pediátrico">
                        <button class="btn btn-outline-primary" type="button" id="btn-toggle-cat" title="Nueva Categoría"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <div class="col-sm-6">
                    <label class="form-label fw-bold small">Marca *</label>
                    <div id="swal-caja-marca-select" class="input-group input-group-sm">
                        <select id="swal-prod-marca" class="form-select">${opcionesMarcas}</select>
                        <input type="text" id="swal-new-marca" class="form-control d-none" placeholder="Nueva marca...">
                        <button class="btn btn-outline-primary" type="button" id="btn-toggle-marca"><i class="fas fa-plus"></i></button>
                    </div>
                    <input type="text" id="swal-prod-marca-text" class="form-control form-control-sm d-none" placeholder="Escriba la marca...">
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-sm-6" id="div-swal-estilo">
                    <label class="form-label fw-bold small text-primary">Estilo / Montura</label>
                    <div class="input-group input-group-sm">
                        <select id="swal-prod-estilo" class="form-select border-primary">${opcionesEstilo}</select>
                        <input type="text" id="swal-new-estilo" class="form-control border-primary d-none" placeholder="Nuevo estilo...">
                        <button class="btn btn-outline-primary" type="button" id="btn-toggle-estilo"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <div class="col-sm-6">
                    <label class="form-label fw-bold small">Modelo *</label>
                    <input type="text" id="swal-prod-modelo" class="form-control form-control-sm">
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-4">
                    <label class="form-label fw-bold small text-muted">Color</label>
                    <input type="text" id="swal-prod-color" class="form-control form-control-sm">
                </div>
                <div class="col-4">
                    <label class="form-label fw-bold small text-muted">Stock</label>
                    <input type="number" id="swal-prod-stock" class="form-control form-control-sm" value="1" min="1">
                </div>
                <div class="col-4">
                    <label class="form-label fw-bold small">Costo *</label>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">$</span>
                        <input type="number" id="swal-prod-costo" class="form-control" placeholder="0.00">
                    </div>
                </div>
            </div>
            <div class="row g-2">
                <div class="col-6">
                    <label class="form-label fw-bold small text-info">Comisión (%)</label>
                    <input type="number" id="swal-prod-comision" class="form-control form-control-sm border-info" value="${configGeneral.porcentajeComisionTarjeta || 0}">
                </div>
                <div class="col-6">
                    <label class="form-label fw-bold small text-success">Precio Venta (Auto)</label>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-success text-white border-success">$</span>
                        <input type="number" id="swal-prod-precio" class="form-control border-success fw-bold text-success" placeholder="0.00">
                    </div>
                </div>
            </div>
        </div>`,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-save me-1"></i> Guardar y Usar',
      didOpen: () => {
        const selCat = document.getElementById("swal-prod-cat");
        const inpCat = document.getElementById("swal-new-cat");
        const divEstilo = document.getElementById("div-swal-estilo");

        const cajaSelect = document.getElementById("swal-caja-marca-select");
        const cajaTexto = document.getElementById("swal-prod-marca-text");

        // Verifica si debe mostrar Estilos basado en lo que seleccione o escriba en Categoría
        const checkEstilo = () => {
          const isNewCat = !inpCat.classList.contains("d-none");
          const textoCat = isNewCat
            ? inpCat.value.toLowerCase()
            : selCat.selectedIndex >= 0
              ? selCat.options[selCat.selectedIndex].text.toLowerCase()
              : "";

          // Aparece si la palabra contiene "armaz"
          divEstilo.classList.toggle("d-none", !textoCat.includes("armaz"));

          // Ajusta el input de marcas
          if (tabActiva === "LENTE" || tabActiva === "CONTACTO") {
            cajaSelect.classList.remove("d-none");
            cajaTexto.classList.add("d-none");
          } else {
            cajaSelect.classList.add("d-none");
            cajaTexto.classList.remove("d-none");
          }
        };

        selCat.onchange = checkEstilo;
        inpCat.oninput = checkEstilo;
        checkEstilo(); // Iniciar validación

        document.getElementById("btn-toggle-cat").onclick = () => {
          selCat.classList.toggle("d-none");
          inpCat.classList.toggle("d-none");
          if (!inpCat.classList.contains("d-none")) inpCat.focus();
          checkEstilo();
        };
        document.getElementById("btn-toggle-marca").onclick = () => {
          document.getElementById("swal-prod-marca").classList.toggle("d-none");
          const i = document.getElementById("swal-new-marca");
          i.classList.toggle("d-none");
          if (!i.classList.contains("d-none")) i.focus();
        };
        document.getElementById("btn-toggle-estilo").onclick = () => {
          document
            .getElementById("swal-prod-estilo")
            .classList.toggle("d-none");
          const i = document.getElementById("swal-new-estilo");
          i.classList.toggle("d-none");
          if (!i.classList.contains("d-none")) i.focus();
        };

        // Matemáticas
        const c = document.getElementById("swal-prod-costo");
        const m = document.getElementById("swal-prod-comision");
        const p = document.getElementById("swal-prod-precio");
        const calc = () => {
          if (c.value > 0)
            p.value = (
              parseFloat(c.value) *
              (1 + parseFloat(m.value) / 100)
            ).toFixed(2);
        };
        c.oninput = calc;
        m.oninput = calc;
      },
      preConfirm: async () => {
        const isNewCat = !document
          .getElementById("swal-new-cat")
          .classList.contains("d-none");
        const catNombreVal = document
          .getElementById("swal-new-cat")
          .value.trim();
        let catId = document.getElementById("swal-prod-cat").value;
        const catNombre = isNewCat
          ? catNombreVal.toLowerCase()
          : document
              .getElementById("swal-prod-cat")
              .options[
                document.getElementById("swal-prod-cat").selectedIndex
              ].text.toLowerCase();

        if (isNewCat && !catNombreVal) {
          Swal.showValidationMessage(
            "Debe escribir un nombre para la categoría",
          );
          return false;
        }

        let marcaFinal = "";
        let isNewMarca = false;

        if (tabActiva === "LENTE" || tabActiva === "CONTACTO") {
          const iNew = document.getElementById("swal-new-marca");
          isNewMarca = !iNew.classList.contains("d-none");
          marcaFinal = isNewMarca
            ? iNew.value.trim()
            : document.getElementById("swal-prod-marca").value;
        } else {
          marcaFinal = document
            .getElementById("swal-prod-marca-text")
            .value.trim();
        }

        const isNewEstilo = !document
          .getElementById("swal-new-estilo")
          .classList.contains("d-none");
        let estiloFinal = isNewEstilo
          ? document.getElementById("swal-new-estilo").value.trim()
          : document.getElementById("swal-prod-estilo").value;

        const modelo = document.getElementById("swal-prod-modelo").value.trim();
        const costo = document.getElementById("swal-prod-costo").value;
        const precio = document.getElementById("swal-prod-precio").value;

        if (!marcaFinal || !modelo || !costo || !precio) {
          Swal.showValidationMessage(
            "Marca, Modelo, Costo y Precio son requeridos",
          );
          return false;
        }

        try {
          // 1. Guardar Categoría Nueva
          if (isNewCat) {
            const resCat = await fetch("/api/tipos-producto", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nombre: catNombreVal,
                icono: "fas fa-box",
                descripcion: "Alta rápida",
                activo: true,
              }),
            });
            if (!resCat.ok) throw new Error("Fallo al crear categoría");
            const dataCat = await resCat.json();
            catId = dataCat.id; // Asignamos el nuevo ID
          }

          // Guardar Marca Nueva
          if (
            isNewMarca &&
            (tabActiva === "LENTE" || tabActiva === "CONTACTO")
          ) {
            const catDestino =
              tabActiva === "CONTACTO" ? "MARCA_CONTACTO" : "MARCA_ARMAZON";
            await fetch("/api/opciones-lente", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                categoria: catDestino,
                nombre: marcaFinal,
                precioBase: 0,
              }),
            });
          }

          // Guardar Estilo Nuevo (Solo si es armazón)
          if (catNombre.includes("armaz") && isNewEstilo && estiloFinal) {
            await fetch("/api/opciones-lente", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                categoria: "TIPO_ARMAZON",
                nombre: estiloFinal,
                precioBase: 0,
              }),
            });
          }

          return {
            nombre:
              `${marcaFinal} ${modelo} ${document.getElementById("swal-prod-color").value}`.trim(),
            marca: marcaFinal,
            modelo: modelo,
            color: document.getElementById("swal-prod-color").value.trim(),
            talla: "Única",
            tipo: { id: parseInt(catId) },
            subTipo: catNombre.includes("armaz") ? estiloFinal : null,
            precioCosto: parseFloat(costo),
            precioVenta: parseFloat(precio),
            porcentajeComision:
              parseFloat(document.getElementById("swal-prod-comision").value) ||
              0,
            stock:
              parseInt(document.getElementById("swal-prod-stock").value) || 1,
            activo: true,
          };
        } catch (err) {
          Swal.showValidationMessage(
            "Error al guardar dependencias: " + err.message,
          );
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        fetch("/api/productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.value),
        })
          .then((res) => res.json())
          .then((nuevoProd) => {
            // OBTENER NOMBRE DE CATEGORÍA (Blindado)
            const catSelect = document.getElementById("swal-prod-cat");
            const catInputNuevo = document.getElementById("swal-new-cat");
            let nomCat = "Producto";

            // Si el input de "Nueva Categoría" es visible, usamos ese texto. Si no, el del select.
            if (catInputNuevo && !catInputNuevo.classList.contains("d-none")) {
              nomCat = catInputNuevo.value.trim() || "Nuevo";
            } else if (catSelect && catSelect.selectedIndex !== -1) {
              nomCat = catSelect.options[catSelect.selectedIndex].text;
            }

            // Inyectamos el nombre para que la descripción se vea bien en el resumen
            if (!nuevoProd.tipo) nuevoProd.tipo = {};
            nuevoProd.tipo.nombre = nomCat;

            // Guardamos en memoria global y refrescamos los selectores
            catalogoGlobal.push(nuevoProd);
            filtrarMarcas();

            setTimeout(() => {
              $("#busqMarca").val(nuevoProd.marca).trigger("change");
              $("#busqModelo").val(nuevoProd.modelo).trigger("change");

              const colorVal =
                nuevoProd.color && nuevoProd.color.trim() !== ""
                  ? nuevoProd.color
                  : "N/A";
              $("#busqColor").val(colorVal).trigger("change");
              $("#busqTalla").val(nuevoProd.id).trigger("change");
            }, 200);

            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "success",
              title: "Producto creado y seleccionado",
              showConfirmButton: false,
              timer: 2000,
              target: document.getElementById("modalConsulta"),
            });

            $("#selectProducto").val(nuevoProd.id);
            const descFinal = `${nomCat} ${nuevoProd.marca} ${nuevoProd.modelo}`;
            $("#armazonModelo").val(descFinal);
            $("#precioArmazon").val(nuevoProd.precioVenta);

            calcularTotales();
          });
      }
    });
  });
}
// ==========================================================
// FUNCIÓN: QUITAR COMISIÓN (VENDER AL COSTO BASE)
// ==========================================================
function quitarComisionProducto() {
  const prodId = $("#selectProducto").val();

  if (!prodId) {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: "Seleccione un producto primero",
      showConfirmButton: false,
      timer: 2000,
    });
    return;
  }

  // Buscamos el producto en el catálogo que ya tienes cargado en memoria
  const producto = catalogoGlobal.find((p) => p.id == prodId);

  if (producto && producto.precioCosto) {
    // Establecemos el valor editable del input al costo base (0% comisión)
    $("#precioArmazon").val(producto.precioCosto.toFixed(2));

    $("#precioArmazon")
      .addClass("bg-warning text-dark")
      .removeClass("text-success");
    setTimeout(() => {
      $("#precioArmazon")
        .removeClass("bg-warning text-dark")
        .addClass("text-success");
    }, 600);

    // Si tienes la función de calcular totales en el carrito, la disparamos
    if (typeof calcularTotales === "function") {
      calcularTotales();
    }
  } else {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title: "No se encontró el costo base del producto",
      showConfirmButton: false,
      timer: 2000,
    });
  }
}
