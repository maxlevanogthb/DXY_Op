const APIURL = "/api/productos";
let dataTable;
let comisionGlobal = 0;
let extraEstiloActual = 0;

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
  cargarMarcas();

  // 2. Listeners para vista previa del nombre
["categoria", "tipo_id", "marcaSelect", "marcaInput", "modelo", "color"].forEach((id) => {
        const input = document.getElementById(id);
        if (input) {
            $(input).on("input change", actualizarPreview);
        }
    });

  // Escuchar cambios en la Categoría para adaptar Marcas y Estilos
    const selectCategoria = document.getElementById("categoria") || document.getElementById("tipo_id");
    if (selectCategoria) {
        selectCategoria.addEventListener("change", adaptarFormularioPorCategoria);
    }

    // Botón para alternar entre Select e Input de Marca
    const btnToggleMarca = document.getElementById('btnToggleMarca');
    if (btnToggleMarca) {
        btnToggleMarca.addEventListener('click', () => {
            const selectM = document.getElementById('marcaSelect');
            const inputM = document.getElementById('marcaInput');
            selectM.classList.toggle('d-none');
            inputM.classList.toggle('d-none');
            if (!inputM.classList.contains('d-none')) inputM.focus();
            
            actualizarPreview(); // Disparar preview al cambiar modo
        });
    }
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
    // 1. Atrapar la Categoría
    const catSelect = document.getElementById("categoria") || document.getElementById("tipo_id");
    if (!catSelect || catSelect.selectedIndex === -1) return;
    const textoCat = catSelect.options[catSelect.selectedIndex].text.toLowerCase();

    // 2. Atrapar la Marca (Saber si es Select o Input)
    let marca = "";
    if (textoCat.includes("armaz") || textoCat.includes("contacto")) {
        const inputNewMarca = document.getElementById("marcaInput");
        const selectMarca = document.getElementById("marcaSelect");
        // Revisa si el input oculto está activo (el usuario le dio al '+')
        const isNew = inputNewMarca && !inputNewMarca.classList.contains("d-none");
        marca = isNew ? inputNewMarca.value.trim() : (selectMarca ? selectMarca.value : "");
    } else {
        const inputMarca = document.getElementById("marcaInput");
        marca = inputMarca ? inputMarca.value.trim() : "";
    }

    // 3. Atrapar Modelo y Color
    const modelo = ($("#modelo").val() || "").trim();
    const color = ($("#color").val() || "").trim();

    // 4. Armar el nombre final
    let nombre = `${marca} ${modelo}`.trim();
    if (color) nombre += ` - ${color}`;

    // 5. Pintar en pantalla
    $("#nombrePreview").text(nombre || "...");
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

async function adaptarFormularioPorCategoria() {

    const catSelect = document.getElementById("categoria") || document.getElementById("tipo_id");
    if (!catSelect || !catSelect.value) return;

    const textoCat = catSelect.options[catSelect.selectedIndex].text.toLowerCase();
    
    const selectM = document.getElementById("marcaSelect");
    const inputM = document.getElementById("marcaInput");
    const btnM = document.getElementById("btnToggleMarca");

    // 1. Mostrar/Ocultar y cargar marcas según la categoría
    if (textoCat.includes("armaz") || textoCat.includes("contacto")) {
        // Es Lente o Contacto -> Mostramos la lista desplegable
        selectM.classList.remove('d-none');
        inputM.classList.add('d-none');
        inputM.value = ""; 
        btnM.classList.remove('d-none');
        
        const catBD = textoCat.includes("contacto") ? "MARCA_CONTACTO" : "MARCA_ARMAZON";
        await cargarMarcasAPI(catBD);
    } else {
        // Son Gotas o Accesorios -> Mostramos input de texto libre
        selectM.classList.add('d-none');
        inputM.classList.remove('d-none');
        btnM.classList.add('d-none');
    }
}

async function cargarMarcasAPI(categoriaFiltro, marcaSeleccionar = null) {
    try {
        const res = await fetch(`/api/opciones-lente?categoria=${categoriaFiltro}`);
        const marcas = await res.json();
        const select = document.getElementById("marcaSelect");
        
        select.innerHTML = '<option value="">Seleccionar marca...</option>';
        marcas.forEach((m) => select.add(new Option(m.nombre, m.nombre)));
        
        if (marcaSeleccionar) select.value = marcaSeleccionar;
    } catch (e) {
        console.error("Error cargando marcas:", e);
    }
}

async function cargarEstilosArmazon(nombreSeleccionar = null) {
  try {
    const res = await fetch("/api/opciones-lente?categoria=TIPO_ARMAZON");
    const estilos = await res.json();

    const select = document.getElementById("subTipo");
    select.innerHTML = '<option value="" data-extra="0">Seleccionar estilo...</option>';

    estilos.forEach((e) => {
      const option = new Option(e.nombre, e.nombre);
      option.dataset.extra = e.precioBase || 0;
      select.add(option);
    });

    if (nombreSeleccionar) select.value = nombreSeleccionar;
  } catch (e) {
    console.error(e);
  }
}

// Carga las marcas desde la BD al abrir la página
async function cargarMarcas(nombreSeleccionar = null) {
  try {
    const res = await fetch("/api/opciones-lente?categoria=MARCA");
    const marcas = await res.json();
    const select = document.getElementById("marca");
    
    select.innerHTML = '<option value="">Seleccionar marca...</option>';
    marcas.forEach((m) => select.add(new Option(m.nombre, m.nombre)));
    
    if (nombreSeleccionar) select.value = nombreSeleccionar;
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

     // COL 4: PRECIO (Oculta Costo si no es Admin)
      {
        data: null,
        className: "text-end align-middle font-monospace py-3",
        render: (data, type, row) => {
          const costo = row.precioCosto || 0;
          const venta = row.precioVenta || 0;

          const format = (num) => "$" + parseFloat(num).toLocaleString("es-MX", { minimumFractionDigits: 2 });

          let html = `<div class="d-flex flex-column align-items-end" style="line-height: 1.2;">`;
          
          // Solo si es Admin pintamos el gris pequeñito con el costo
          if (ES_ADMIN) {
              html += `<span class="small text-muted mb-1" title="Precio Costo (Sin Comisión)">
                  <i class="fas fa-box-open opacity-50 me-1"></i>${format(costo)}
              </span>`;
          }
          
          // El precio de venta lo ven todos
          html += `<span class="fw-bold text-success fs-6" title="Precio Venta">
                  <i class="fas fa-tag opacity-50 me-1"></i>${format(venta)}
              </span>
          </div>`;
          
          return html;
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

      // COL 6: ACCIONES (Oculta Eliminar si no es Admin)
      {
        data: null,
        className: "text-center align-middle py-3",
        orderable: false,
        render: (data) => {
            // El botón de editar lo tienen ambos
            let botones = `<button class="btn btn-sm btn-light border text-primary hover-shadow" onclick="editarProducto(${data.id})" title="Editar"><i class="fas fa-edit"></i></button>`;
            
            // El botón de eliminar solo lo tiene el Admin
            if (ES_ADMIN) {
                botones += `<button class="btn btn-sm btn-light border text-danger hover-shadow ms-1" onclick="eliminarProducto(${data.id})" title="Desactivar"><i class="fas fa-trash-alt"></i></button>`;
            }
            
            return `<div class="btn-group shadow-sm">${botones}</div>`;
        },
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
  
  $("#subTipo").val("");
  extraEstiloActual = 0; 
  
  $("#nombrePreview").text("...");
  $("#porcentajeComision").val(comisionGlobal);

  // Restaurar el estado visual de la marca por defecto
  $("#marcaSelect").removeClass("d-none");
  $("#marcaInput").addClass("d-none");

  $("#modalTitulo").html('<i class="fas fa-box-open me-2"></i>Nuevo Producto');
  
  adaptarFormularioPorCategoria();

  new bootstrap.Modal(document.getElementById("modalProducto")).show();
}
function editarProducto(id) {
  fetch(APIURL + "/" + id)
    .then((res) => res.json())
    .then((prod) => {
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

      const catId =
        prod.tipo && typeof prod.tipo === "object" ? prod.tipo.id : prod.tipo;
      $("#categoria").val(catId);

      verificarSubtipo();
      if (prod.subTipo) $("#subTipo").val(prod.subTipo);

      // ¡Esta línea tuya está perfecta aquí!
      extraEstiloActual = parseFloat($("#subTipo").find("option:selected").data("extra")) || 0;

      actualizarPreview();

      // EN LUGAR DE RECALCULAR, PONEMOS EL PRECIO EXACTO QUE VIENE DE LA BD
      $("#precio").val(ventaOriginal ? parseFloat(ventaOriginal).toFixed(2) : "");

      $("#modalTitulo").html('<i class="fas fa-edit me-2"></i>Editar Producto');
      new bootstrap.Modal(document.getElementById("modalProducto")).show();
    })
    .catch((err) =>
      Swal.fire("Error", "No se pudo cargar el producto", "error"),
    );
}


async function guardarProducto() {
  // 1. Validar que el formulario cumpla con los requerimientos de HTML
  if (!$("#formProducto")[0].checkValidity()) {
    $("#formProducto")[0].reportValidity();
    return;
  }

  const id = $("#productoId").val();

  // 2. Atrapar la Categoría Seleccionada (Soporta id="categoria" o id="tipo_id")
  const catSelect = document.getElementById("categoria") || document.getElementById("tipo_id");
  const textoCat = catSelect.options[catSelect.selectedIndex].text.toLowerCase();

  // 3. Lógica Inteligente para la MARCA
  const inputMarca = document.getElementById("marcaInput");
  const selectMarca = document.getElementById("marcaSelect");
  
  let isNewMarca = false;
  let marcaFinal = "";

  // Si es armazón o contacto, revisamos si escribió una marca nueva o usó el select
  if (textoCat.includes("armaz") || textoCat.includes("contacto")) {
      isNewMarca = !inputMarca.classList.contains("d-none");
      marcaFinal = isNewMarca ? inputMarca.value.trim() : selectMarca.value;
  } else {
      // Si son gotas o accesorios, siempre atrapamos el input de texto libre
      marcaFinal = inputMarca.value.trim(); 
  }

  // Validar que la marca no esté vacía
  if (!marcaFinal) {
      Swal.fire("Atención", "La marca es obligatoria", "warning");
      return;
  }

  // ⭐ 4. Guardar la marca nueva en la Base de Datos (Si aplica)
  if (isNewMarca && (textoCat.includes("armaz") || textoCat.includes("contacto"))) {
      try {
          const catDestino = textoCat.includes("contacto") ? "MARCA_CONTACTO" : "MARCA_ARMAZON";
          await fetch("/api/opciones-lente", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ categoria: catDestino, nombre: marcaFinal, precioBase: 0 })
          });
      } catch(e) {
          console.error("Error al guardar la nueva marca", e);
      }
  }

  // 5. Extraer el resto de textos de forma segura
  const modelo = ($("#modelo").val() || "").trim();
  const color = ($("#color").val() || "").trim();
  const talla = ($("#talla").val() || "").trim();
  
  // Generamos el nombre de producto inteligente
  const nombre = `${marcaFinal} ${modelo} ${color ? "- " + color : ""}`.trim();

  // 6. Extraer datos financieros dependiendo del ROL (Admin vs Recepción)
  const costoVal = $("#precioCosto").length > 0 ? parseFloat($("#precioCosto").val()) : 0;
  const comisionVal = $("#porcentajeComision").length > 0 ? parseFloat($("#porcentajeComision").val()) : 0;

  // 7. Construir el objeto exactamente como lo espera tu backend en Java
  const producto = {
    id: id ? parseInt(id) : null,
    nombre: nombre,
    marca: marcaFinal,
    modelo: modelo,
    color: color,
    talla: talla,
    tipo: { id: parseInt(catSelect.value) },
    subTipo: $("#subTipo").val() || null,
    precioVenta: parseFloat($("#precio").val()) || 0,
    stock: parseInt($("#stock").val()) || 0,
    precioCosto: costoVal,
    porcentajeComision: comisionVal,
  };

  // 8. Enviar a la base de datos usando async/await
  try {
      const res = await fetch(APIURL + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });
      
      if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById("modalProducto")).hide();
        dataTable.ajax.reload(null, false);
        Swal.fire("Éxito", "Producto guardado correctamente", "success");
      } else {
        throw new Error("Error en el servidor al intentar guardar");
      }
  } catch (err) {
      Swal.fire("Error", err.message, "error");
  }
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
    width: "600px",
    html: `
        <div class="text-start mt-3">
            <div class="mb-3">
                <label class="form-label fw-bold small">Nombre del Estilo *</label>
                <input type="text" id="swal-estilo-nombre" class="form-control" placeholder="Ej. Aviador, Cat Eye...">
            </div>
            <div class="row g-2 mb-3">
                <div class="col-4">
                    <label class="form-label fw-bold small">Costo *</label>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-body-tertiary">$</span>
                        <input type="number" id="swal-estilo-costo" class="form-control" placeholder="0.00">
                    </div>
                </div>
                <div class="col-4">
                    <label class="form-label fw-bold small text-info">Comisión</label>
                    <div class="input-group input-group-sm">
                        <input type="number" id="swal-estilo-comision" class="form-control border-info" value="${comisionGlobal || 0}">
                        <span class="input-group-text bg-info text-white border-info">%</span>
                    </div>
                </div>
                <div class="col-4">
                    <label class="form-label fw-bold small text-success">P. Venta</label>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-success text-white border-success">$</span>
                        <input type="number" id="swal-estilo-precio" class="form-control border-success text-success fw-bold" placeholder="0.00">
                    </div>
                </div>
            </div>
        </div>
    `,
    showCancelButton: true,
    confirmButtonColor: "#0d6efd",
    confirmButtonText: '<i class="fas fa-save"></i> Guardar',
    cancelButtonText: "Cancelar",
    target: document.getElementById(modalId),
    didOpen: () => {
      const inputCosto = document.getElementById("swal-estilo-costo");
      const inputComision = document.getElementById("swal-estilo-comision");
      const inputPrecio = document.getElementById("swal-estilo-precio");

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
      const nombre = document.getElementById("swal-estilo-nombre").value.trim();
      const costo = document.getElementById("swal-estilo-costo").value;
      const comision = document.getElementById("swal-estilo-comision").value;
      const precio = document.getElementById("swal-estilo-precio").value;

      if (!nombre || !costo || !precio) {
        Swal.showValidationMessage(
          "El nombre, costo y precio son obligatorios",
        );
        return false;
      }
      return {
        categoria: "TIPO_ARMAZON",
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
            title: "Estilo agregado",
            showConfirmButton: false,
            timer: 2000,
            target: document.getElementById(modalId),
          });
          cargarEstilosArmazon(nuevaOpcion.nombre);
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
// F. CÁLCULO BIDIRECCIONAL DE PRECIOS
// ==========================================

// 1. De Costo/Comisión hacia Precio (Solo para ADMIN)
function calcularDesdeComision() {
  // Si el campo de costo no existe en el HTML (Recepción), no hacemos nada
  if ($("#precioCosto").length === 0) return;

  const costo = parseFloat($("#precioCosto").val()) || 0;
  const comision = parseFloat($("#porcentajeComision").val()) || 0;

  // El precio base es Costo + Comisión. Y a eso siempre le sumamos el Estilo.
  if (costo > 0) {
    const precioVenta = costo + (costo * (comision / 100)) + extraEstiloActual;
    $("#precio").val(precioVenta.toFixed(2));
  } else if (extraEstiloActual > 0) {
    // Si aún no pone costo pero ya eligió estilo, mostramos lo del estilo
    $("#precio").val(extraEstiloActual.toFixed(2));
  } else {
    $("#precio").val("");
  }
}

// 2. De Precio hacia Comisión (Solo para ADMIN)
function calcularDesdePrecio() {
  if ($("#precioCosto").length === 0) return;

  const costo = parseFloat($("#precioCosto").val()) || 0;
  const precioVentaTotal = parseFloat($("#precio").val()) || 0;

  // Al precio total le restamos el estilo para saber cuánto ganamos por el armazón base
  const precioRealArmazon = precioVentaTotal - extraEstiloActual;

  if (costo > 0 && precioRealArmazon >= costo) {
    const nuevaComision = ((precioRealArmazon / costo) - 1) * 100;
    $("#porcentajeComision").val(nuevaComision.toFixed(2));
  } else {
    $("#porcentajeComision").val(0);
  }
}

// Abre un Swal pequeño para crear la marca al vuelo (Sin precios)
function crearMarcaInSitu(modalId) {
  Swal.fire({
    title: "Nueva Marca",
    input: "text",
    inputLabel: "Nombre de la marca",
    inputPlaceholder: "Ej. Ray-Ban, Oakley, Prada...",
    showCancelButton: true,
    confirmButtonText: '<i class="fas fa-save"></i> Guardar',
    cancelButtonText: "Cancelar",
    target: document.getElementById(modalId),
    preConfirm: (nombre) => {
      if (!nombre || nombre.trim() === "") {
        Swal.showValidationMessage("El nombre es obligatorio");
        return false;
      }
      // Lo guardamos como OpcionLente, pero categoría MARCA
      return fetch("/api/opciones-lente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria: "MARCA",
          nombre: nombre.trim(),
          precioBase: 0,
          precioCosto: 0,
          porcentajeComision: 0
        })
      })
      .then(res => res.json())
      .catch(err => Swal.showValidationMessage("Error al guardar la marca"));
    }
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Marca agregada", showConfirmButton: false, timer: 2000, target: document.getElementById(modalId) });
      cargarMarcas(result.value.nombre); // Recarga y selecciona la nueva marca
    }
  });
}

// 3. Disparar los cálculos cuando el usuario escriba o cambie opciones
$(document).ready(function () {
  $("#precioCosto, #porcentajeComision").on("input", calcularDesdeComision);
  $("#precio").on("input", calcularDesdePrecio); 

  $("#marca, #modelo, #color").on("input", actualizarPreview);
  
  $("#subTipo").on("change", function () {
    const opcionSeleccionada = $(this).find("option:selected");
    const nuevoExtra = parseFloat(opcionSeleccionada.data("extra")) || 0;

    if ($("#precioCosto").length > 0) {
        // == MODO ADMIN ==
        extraEstiloActual = nuevoExtra;
        calcularDesdeComision(); // Recalcula sumando costo + comisión + estilo
    } else {
        // == MODO RECEPCIÓN ==
        const inputPrecio = $("#precio");
        let precioVentaActual = parseFloat(inputPrecio.val()) || 0;
        
        // Restamos el estilo anterior y sumamos el nuevo sin tocar comisión
        precioVentaActual = (precioVentaActual - extraEstiloActual) + nuevoExtra;
        inputPrecio.val(precioVentaActual > 0 ? precioVentaActual.toFixed(2) : "");
        
        extraEstiloActual = nuevoExtra;
    }
  });
});