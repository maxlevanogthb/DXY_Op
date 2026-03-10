const APIURL = "/api/productos";
let dataTable;
let comisionGlobal = 0;

// Traer configuración al cargar la página
fetch("/api/configuracion")
  .then((res) => res.json())
  .then((data) => {
    comisionGlobal = data.porcentajeComisionTarjeta || 0;
  });

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicializar componentes
  inicializarTabla();
  inicializarFiltros();
  cargarCategorias();
  cargarEstilosArmazon();

  // 2. Listeners para vista previa del nombre
  ["marca", "modelo", "color"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.addEventListener("input", actualizarPreview);
  });
});

// ==========================================
// A. UTILIDADES (Aquí estaba el error)
// ==========================================

// Esta es la función que te faltaba y causaba el error
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ==========================================
// B. LÓGICA VISUAL
// ==========================================

function actualizarPreview() {
  const marca = document.getElementById("marca").value;
  const modelo = document.getElementById("modelo").value;
  const color = document.getElementById("color").value;
  const nombre = `${marca} ${modelo} ${color ? "- " + color : ""}`.trim();
  document.getElementById("nombrePreview").textContent = nombre || "...";
}

function verificarSubtipo() {
  const selectCat = document.getElementById("categoria");
  const divSubtipo = document.getElementById("divSubtipo");
  const selectSubtipo = document.getElementById("subTipo");

  if (!selectCat || selectCat.selectedIndex === -1) return;

  const opcion = selectCat.options[selectCat.selectedIndex];
  const nombreCategoria = opcion.dataset.nombre
    ? opcion.dataset.nombre.toLowerCase()
    : "";

  if (
    nombreCategoria.includes("armazón") ||
    nombreCategoria.includes("armazon")
  ) {
    divSubtipo.style.display = "block";
  } else {
    divSubtipo.style.display = "none";
    selectSubtipo.value = "";
  }
}

// ==========================================
// C. CARGA DE DATOS
// ==========================================

async function cargarCategorias(idSeleccionar = null) {
  try {
    const res = await fetch("/api/tipos-producto");
    const tipos = await res.json();

    // Filtro superior (Tabla)
    const filtro = document.getElementById("filtroTipo");
    filtro.innerHTML = '<option value="">Todos los tipos</option>';
    tipos.forEach((t) => filtro.add(new Option(t.nombre, t.nombre)));

    // Select del modal
    const selectModal = document.getElementById("categoria");
    selectModal.innerHTML = '<option value="">Selecciona categoría...</option>';
    tipos.forEach((t) => {
      const option = document.createElement("option");
      option.value = t.id;
      option.text = t.nombre;
      option.dataset.nombre = t.nombre;
      selectModal.appendChild(option);
    });

    // Si acabamos de crear una, la selecciona automáticamente
    if (idSeleccionar) {
      selectModal.value = idSeleccionar;
      verificarSubtipo(); // Dispara la lógica visual para mostrar el subtipo si es armazón
    }
  } catch (e) {
    console.error(e);
  }
}

async function cargarEstilosArmazon(nombreSeleccionar = null) {
  try {
    // Usamos el endpoint nuevo de Catálogos Clínicos
    const res = await fetch("/api/opciones-lente?categoria=TIPO_ARMAZON");
    const estilos = await res.json();

    const select = document.getElementById("subTipo");
    select.innerHTML = '<option value="">Seleccionar estilo...</option>';
    estilos.forEach((e) => select.add(new Option(e.nombre, e.nombre)));

    // Auto-selecciona el nuevo estilo
    if (nombreSeleccionar) {
      select.value = nombreSeleccionar;
    }
  } catch (e) {
    console.error(e);
  }
}

function inicializarTabla() {
  if ($.fn.DataTable.isDataTable("#tablaProductos")) {
    $("#tablaProductos").DataTable().destroy();
  }

  dataTable = $("#tablaProductos").DataTable({
    ajax: { url: APIURL, dataSrc: "" },
    columns: [
      // COL 1: ID (Gris discreto)
      {
        data: "id",
        className: "text-center align-middle text-secondary small py-3",
      },

      // COL 2: PRODUCTO (Negrita para nombre, iconos para detalles)
      {
        data: null,
        className: "align-middle py-3",
        render: (data, type, row) => {
          return `
                        <div class="d-flex flex-column">
                            <span class="fw-bold text-dark fs-6">${row.nombre}</span>
                            <div class="small text-muted mt-1">
                                <span class="badge bg-light text-secondary border me-1">
                                    <i class="fas fa-tag me-1"></i>${row.marca || "Genérico"}
                                </span>
                                <span>${row.modelo || ""}</span>
                            </div>
                        </div>`;
        },
      },

      // COL 3: DETALLES (Badge azul suave + info limpia)
      {
        data: null,
        className: "align-middle py-3",
        render: (data, type, row) => {
          const nombreTipo = row.tipo ? row.tipo.nombre || row.tipo : "N/A";

          // Lógica para color y talla
          const colorInfo = row.color
            ? `<span class="text-dark fw-medium">${row.color}</span>`
            : '<span class="text-muted fst-italic">Sin color</span>';
          const tallaInfo = row.talla
            ? `<span class="ms-2 ps-2 border-start border-secondary">${row.talla}</span>`
            : "";
          const subTipoInfo = row.subTipo
            ? `<div class="mt-1 small text-muted"><i class="fas fa-glasses me-1 text-primary opacity-50"></i>${row.subTipo}</div>`
            : "";

          return `
                        <div class="d-flex flex-column align-items-start">
                            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 mb-2 px-3">
                                ${nombreTipo}
                            </span>
                            <div class="small">
                                ${colorInfo} ${tallaInfo}
                            </div>
                            ${subTipoInfo}
                        </div>`;
        },
      },

      // COL 4: PRECIO (Verde y fuente monoespaciada para números)
      {
        data: "precioVenta",
        className:
          "text-end align-middle fw-bold text-success font-monospace py-3 fs-6",
        render: (precio) => {
          const valor = precio || 0;
          return (
            "$" +
            parseFloat(valor).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })
          );
        },
      },

      // COL 5: STOCK (Colores semánticos)
      {
        data: "stock",
        className: "text-center align-middle py-3",
        render: (stock) => {
          let badgeClass = "bg-success bg-opacity-75"; // Stock sano
          let icon = "";

          if (stock <= 2) {
            badgeClass = "bg-danger"; // Crítico
            icon = '<i class="fas fa-exclamation-circle me-1"></i>';
          } else if (stock <= 5) {
            badgeClass = "bg-warning text-dark"; // Advertencia (Texto oscuro para contraste)
            icon = '<i class="fas fa-exclamation-triangle me-1"></i>';
          }

          return `<span class="badge ${badgeClass} rounded-pill px-3 py-2 shadow-sm border border-light">
                                ${icon}${stock}
                            </span>`;
        },
      },

      // COL 6: ACCIONES (Botones limpios)
      {
        data: null,
        className: "text-center align-middle py-3",
        orderable: false,
        render: (data) => `
                    <div class="btn-group shadow-sm">
                        <button class="btn btn-sm btn-light border text-primary hover-shadow" onclick="editarProducto(${data.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-light border text-danger hover-shadow" onclick="eliminarProducto(${data.id})" title="Desactivar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>`,
      },
    ],
    // Opciones visuales extra de DataTables
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json",
    },
    responsive: true,
    autoWidth: false, // Mejora el ajuste de columnas
    order: [[0, "desc"]],
    dom: '<"d-none"f>rt<"d-flex justify-content-between align-items-center mt-3 px-2"ip>', // Limpia el buscador default y paginación
  });
}

function inicializarFiltros() {
  $("#filtroTipo").on("change", function () {
    if (this.value) dataTable.column(2).search(this.value).draw();
    else dataTable.column(2).search("").draw();
  });

  // Aquí se usa la función debounce
  $("#buscarNombre").on(
    "keyup",
    debounce(function () {
      dataTable.search(this.value).draw();
    }, 300),
  );
}

// ==========================================
// D. CRUD
// ==========================================

function abrirModalNuevo() {
    $("#formProducto")[0].reset();
    $("#productoId").val("");
    $("#divSubtipo").hide();
    $("#nombrePreview").text("...");
    
    $("#porcentajeComision").val(comisionGlobal);
    
    $("#modalTitulo").html('<i class="fas fa-box-open me-2"></i>Nuevo Producto');
    new bootstrap.Modal(document.getElementById("modalProducto")).show();
}

function editarProducto(id) {
    fetch(APIURL + "/" + id)
        .then(res => res.json())
        .then(prod => {
            $("#productoId").val(prod.id);
            $("#marca").val(prod.marca);
            $("#modelo").val(prod.modelo);
            $("#color").val(prod.color);
            $("#talla").val(prod.talla);
            $("#stock").val(prod.stock);
            
            let costo = prod.precioCosto;
            let comision = prod.porcentajeComision;
            let ventaOriginal = prod.precioVenta || 0;

            // Si es un producto viejo (Costo 0 o vacío)
            if (costo === null || costo === undefined || costo === 0) {
                costo = ventaOriginal; // El precio histórico se convierte en el Costo Base
                comision = comisionGlobal; // ⭐ INYECTAMOS LA COMISIÓN GLOBAL SOLITA
            } else if (comision === null || comision === undefined) {
                comision = comisionGlobal;
            }

            $("#precioCosto").val(costo || 0);
            $("#porcentajeComision").val(comision);

            // ========================================================

            const catId = (prod.tipo && typeof prod.tipo === "object") ? prod.tipo.id : prod.tipo;
            $("#categoria").val(catId);
            
            verificarSubtipo(); 
            if (prod.subTipo) $("#subTipo").val(prod.subTipo);

            actualizarPreview();

            // Al recalcular ahora, respetará el precio original
            calcularPrecioVenta();

            $("#modalTitulo").html('<i class="fas fa-edit me-2"></i>Editar Producto');
            new bootstrap.Modal(document.getElementById("modalProducto")).show();
        })
        .catch(err => Swal.fire("Error", "No se pudo cargar el producto", "error"));
}

function guardarProducto() {
  if (!$("#formProducto")[0].checkValidity()) {
    $("#formProducto")[0].reportValidity();
    return;
  }

  const id = $("#productoId").val();
  const marca = $("#marca").val().trim();
  const modelo = $("#modelo").val().trim();
  const color = $("#color").val().trim();
  const nombre = `${marca} ${modelo} ${color ? "- " + color : ""}`.trim();

  const producto = {
    id: id ? parseInt(id) : null,
    nombre: nombre,
    marca: marca,
    modelo: modelo,
    color: color,
    talla: $("#talla").val().trim(),
    tipo: { id: parseInt($("#categoria").val()) },
    subTipo: $("#subTipo").val(),
    precioVenta: parseFloat($("#precio").val()), // Ajustado para enviar al backend
    stock: parseInt($("#stock").val()) || 0,
    precioCosto: parseFloat($("#precioCosto").val()) || 0,
    porcentajeComision: parseFloat($("#porcentajeComision").val()) || 0,
  };

  fetch(APIURL + (id ? "/" + id : ""), {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  })
    .then((res) => {
      if (res.ok) {
        bootstrap.Modal.getInstance(
          document.getElementById("modalProducto"),
        ).hide();
        dataTable.ajax.reload(null, false);
        Swal.fire("Éxito", "Producto guardado", "success");
      } else {
        throw new Error("Error en servidor");
      }
    })
    .catch((err) => Swal.fire("Error", err.message, "error"));
}

function eliminarProducto(id) {
  Swal.fire({
    title: "¿Desactivar?",
    text: "El producto ya no será visible.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, borrar",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(APIURL + "/" + id, { method: "DELETE" }).then((res) => {
        if (res.ok) {
          dataTable.ajax.reload(null, false);
          Swal.fire("Listo", "Producto eliminado", "success");
        }
      });
    }
  });
}

// ==========================================
// E. CREACIÓN IN-SITU (ACCESOS RÁPIDOS)
// ==========================================

function crearTipoInSitu(modalId) {
  Swal.fire({
    title: "Nueva Categoría de Producto",
    html: `
            <div class="text-start mt-3">
                <div class="mb-3">
                    <label class="form-label fw-bold small">Nombre *</label>
                    <input type="text" id="swal-tipo-nombre" class="form-control" placeholder="Ej. Lentes de Contacto">
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold small">Icono Representativo</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-icons"></i></span>
                        <select id="swal-tipo-icono" class="form-select">
                            <option value="fas fa-glasses">👓 Gafas / Armazones</option>
                            <option value="fas fa-eye">👁️ Ojo / Visión general</option>
                            <option value="fas fa-eye-dropper">💧 Gotas / Soluciones</option>
                            <option value="fas fa-box">📦 Caja / Paquete</option>
                            <option value="fas fa-sun">🌞 Lentes de Sol</option>
                            <option value="fas fa-spray-can">🧴 Limpiadores / Spray</option>
                            <option value="fas fa-toolbox">🧰 Estuches / Accesorios</option>
                            <option value="fas fa-tags">🏷️ Etiqueta General</option>
                        </select>
                    </div>
                </div>
            </div>
        `,
    showCancelButton: true,
    confirmButtonColor: "#0d6efd",
    confirmButtonText: '<i class="fas fa-save"></i> Guardar',
    cancelButtonText: "Cancelar",
    target: document.getElementById(modalId), // Se ancla al modal para permitir escribir
    preConfirm: () => {
      const nombre = document.getElementById("swal-tipo-nombre").value.trim();
      if (!nombre) {
        Swal.showValidationMessage("El nombre es obligatorio");
        return false;
      }
      return {
        nombre: nombre,
        icono: document.getElementById("swal-tipo-icono").value,
        descripcion: "Agregado desde acceso rápido",
      };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/api/tipos-producto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.value),
      })
        .then((res) => res.json())
        .then((nuevoTipo) => {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Categoría agregada",
            showConfirmButton: false,
            timer: 2000,
            target: document.getElementById(modalId),
          });
          cargarCategorias(nuevoTipo.id); // Recarga y auto-selecciona el nuevo ID
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

function crearEstiloInSitu(modalId) {
  Swal.fire({
    title: "Nuevo Estilo / Montura",
    html: `
            <div class="text-start mt-3">
                <div class="mb-3">
                    <label class="form-label fw-bold small">Nombre del Estilo *</label>
                    <input type="text" id="swal-estilo-nombre" class="form-control" placeholder="Ej. Aviador, Cat Eye, Ovalado...">
                </div>
            </div>
        `,
    showCancelButton: true,
    confirmButtonColor: "#0d6efd",
    confirmButtonText: '<i class="fas fa-save"></i> Guardar',
    cancelButtonText: "Cancelar",
    target: document.getElementById(modalId),
    preConfirm: () => {
      const nombre = document.getElementById("swal-estilo-nombre").value.trim();
      if (!nombre) {
        Swal.showValidationMessage("El nombre es obligatorio");
        return false;
      }
      return {
        categoria: "TIPO_ARMAZON",
        nombre: nombre,
        precioBase: 0.0,
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
            title: "Estilo agregado",
            showConfirmButton: false,
            timer: 2000,
            target: document.getElementById(modalId),
          });
          cargarEstilosArmazon(nuevaOpcion.nombre); // Recarga y auto-selecciona el nuevo nombre
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

function calcularPrecioVenta() {
  const costo = parseFloat($("#precioCosto").val()) || 0;
  const comision = parseFloat($("#porcentajeComision").val()) || 0;
  const precioVenta = costo + costo * (comision / 100);
  $("#precio").val(precioVenta.toFixed(2));
}

// Disparar el cálculo cuando el usuario escriba
$(document).ready(function () {
  $("#precioCosto, #porcentajeComision").on("input", calcularPrecioVenta);
});
