const API_URL = "/api/opciones-lente";

document.addEventListener("DOMContentLoaded", () => {
  cargarTabla("MATERIAL");

  $("#nuevoCosto, #nuevoComision").on("input", () => {
    const costo = parseFloat($("#nuevoCosto").val()) || 0;
    const comision = parseFloat($("#nuevoComision").val()) || 0;
    if (costo > 0)
      $("#nuevoPrecio").val((costo * (1 + comision / 100)).toFixed(2));
    else $("#nuevoPrecio").val("");
  });

  $("#nuevoPrecio").on("input", () => {
    const costo = parseFloat($("#nuevoCosto").val()) || 0;
    const precio = parseFloat($("#nuevoPrecio").val()) || 0;
    if (costo > 0 && precio >= costo)
      $("#nuevoComision").val(((precio / costo - 1) * 100).toFixed(2));
    else $("#nuevoComision").val(0);
  });
});

function cargarTabla(categoria) {
    document.getElementById("categoriaActual").value = categoria;
    cancelarEdicionOpcion(); // Limpia y auto-asigna la comisión global

    // --- MAGIA VISUAL INTELIGENTE ---
    const camposPrecio = document.querySelectorAll('.campo-precio');
    const colNombre = document.getElementById('colNombre');
    const colBotones = document.getElementById('colBotones');
    const thPrecios = document.getElementById('thPrecios');
    const inputNombre = document.getElementById('nuevoNombre');

    // Comprobamos si la categoría actual es una de las que "No lleva precio"
    const sinPrecios = categoria === 'MARCA_ARMAZON' || categoria === 'MARCA_CONTACTO' || categoria === 'TIPO_ARMAZON';

    if (sinPrecios) {
        // Ocultar columnas de precio
        camposPrecio.forEach(el => el.classList.add('d-none'));
        if (thPrecios) thPrecios.classList.add('d-none');
        // Expandir Nombre y Botones
        if (colNombre) colNombre.className = 'col-md-9';
        if (colBotones) colBotones.className = 'col-md-3 d-flex gap-2';
        
        // Cambiar el placeholder según lo que estemos agregando
        if(categoria === 'TIPO_ARMAZON') inputNombre.placeholder = "Ej. Aviador, Cat-Eye, Completo...";
        else inputNombre.placeholder = "Ej. Ray-Ban, Acuvue, Prada...";
    } else {
        // Mostrar columnas de precio
        camposPrecio.forEach(el => el.classList.remove('d-none'));
        if (thPrecios) thPrecios.classList.remove('d-none');
        // Regresar a la distribución original
        if (colNombre) colNombre.className = 'col-md-3';
        if (colBotones) colBotones.className = 'col-md-3 d-flex gap-2';
        inputNombre.placeholder = "Ej. Hi-Index 1.67";
    }
    // ------------------------------------

    const tbody = document.getElementById("tablaCuerpo");
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';

    fetch(`${API_URL}?categoria=${categoria}`)
        .then((res) => res.json())
        .then((data) => {
            tbody.innerHTML = "";
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No hay opciones registradas</td></tr>';
                return;
            }

            data.forEach((item) => {
                const costo = item.precioCosto || 0;
                const venta = item.precioBase || 0;
                const format = (num) => "$" + parseFloat(num).toLocaleString("es-MX", { minimumFractionDigits: 2 });

                let contenidoPrecios = "";
                
                // Solo mostramos los precios si es necesario
                if (!sinPrecios) {
                    contenidoPrecios = `
                        <div class="d-flex flex-column align-items-end" style="line-height: 1.2;">
                            <span class="small text-muted mb-1" title="Costo (Sin Comisión)">
                                <i class="fas fa-box-open opacity-50 me-1"></i>${format(costo)}
                            </span>
                            <span class="fw-bold text-success fs-6" title="Precio Venta (Con Comisión)">
                                <i class="fas fa-tag opacity-50 me-1"></i>${format(venta)}
                            </span>
                        </div>
                    `;
                }

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">${item.nombre}</td>
                        <td class="${sinPrecios ? 'd-none' : 'text-end pe-4'}">
                            ${contenidoPrecios}
                        </td>
                        <td class="text-center">
                            <div class="btn-group shadow-sm">
                                <button class="btn btn-sm btn-outline-warning" onclick="editarOpcion(${item.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="eliminarOpcion(${item.id})" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        })
        .catch((err) => console.error("Error al cargar la tabla", err));
}

function guardarOpcion() {
    const id = document.getElementById("nuevoId").value;
    const categoria = document.getElementById("categoriaActual").value;
    const nombre = document.getElementById("nuevoNombre").value.trim();

    if (!nombre) {
        Swal.fire("Atención", "El nombre es obligatorio", "warning");
        return;
    }

    const sinPrecios = categoria === 'MARCA_ARMAZON' || categoria === 'MARCA_CONTACTO' || categoria === 'TIPO_ARMAZON';

    let costoVal = 0, comisionVal = 0, ventaVal = 0;
    
    // Si la categoría SI lleva precios, validamos que los escriban
    if (!sinPrecios) {
        costoVal = parseFloat(document.getElementById("nuevoCosto").value) || 0;
        comisionVal = parseFloat(document.getElementById("nuevoComision").value) || 0;
        ventaVal = parseFloat(document.getElementById("nuevoPrecio").value) || 0;
        
        if(ventaVal === 0 && costoVal > 0) {
            Swal.fire("Atención", "Ingrese un precio de venta válido", "warning");
            return;
        }
    }

    const data = {
        categoria: categoria,
        nombre: nombre,
        precioCosto: costoVal,
        porcentajeComision: comisionVal,
        precioBase: ventaVal,
    };

    const url = id ? `${API_URL}/${id}` : API_URL;
    const metodo = id ? "PUT" : "POST";

    fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }).then((res) => {
        if (res.ok) {
            Swal.fire({
                toast: true, position: "top-end", icon: "success",
                title: id ? "Actualizado" : "Guardado", showConfirmButton: false, timer: 2000,
            });
            cancelarEdicionOpcion();
            cargarTabla(categoria);
        } else {
            Swal.fire("Error", "No se pudo guardar", "error");
        }
    });
}

function editarOpcion(id) {
  fetch(`${API_URL}/${id}`)
    .then((res) => res.json())
    .then((opcion) => {
      document.getElementById("nuevoId").value = opcion.id;
      document.getElementById("nuevoNombre").value = opcion.nombre;
      document.getElementById("nuevoCosto").value = opcion.precioCosto || 0;
      document.getElementById("nuevoComision").value =
        opcion.porcentajeComision || 0;
      document.getElementById("nuevoPrecio").value = opcion.precioBase || 0;

      const btnGuardar = document.getElementById("btnGuardarOpcion");
      if (btnGuardar) {
        btnGuardar.innerHTML = '<i class="fas fa-sync-alt me-1"></i>Actualizar';
        btnGuardar.classList.remove("btn-success");
        btnGuardar.classList.add("btn-warning", "text-dark");
      }

      const btnCancelar = document.getElementById("btnCancelarEdicion");
      if (btnCancelar) btnCancelar.classList.remove("d-none");

      document.getElementById("nuevoNombre").focus();
    });
}

function cancelarEdicionOpcion() {
  const inputId = document.getElementById("nuevoId");
  if (inputId) inputId.value = "";

  const inputNombre = document.getElementById("nuevoNombre");
  if (inputNombre) inputNombre.value = "";

  // Leer la comisión global de la otra pestaña para inyectarla por defecto
  const comisionGlobalVal = document.getElementById("confComision")
    ? parseFloat(document.getElementById("confComision").value)
    : 0;

  document.getElementById("nuevoCosto").value = "";
  document.getElementById("nuevoComision").value = isNaN(comisionGlobalVal)
    ? 0
    : comisionGlobalVal;
  document.getElementById("nuevoPrecio").value = "";

  const btnGuardar = document.getElementById("btnGuardarOpcion");
  if (btnGuardar) {
    btnGuardar.innerHTML = '<i class="fas fa-plus me-1"></i>Agregar';
    btnGuardar.classList.remove("btn-warning", "text-dark");
    btnGuardar.classList.add("btn-success");
  }

  const btnCancelar = document.getElementById("btnCancelarEdicion");
  if (btnCancelar) btnCancelar.classList.add("d-none");
}

function eliminarOpcion(id) {
  Swal.fire({
    title: "¿Eliminar?",
    text: "Esta opción dejará de aparecer en nuevas consultas.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sí, borrar",
  }).then((result) => {
    if (result.isConfirmed) {
      const categoria = document.getElementById("categoriaActual").value;
      fetch(`${API_URL}/${id}`, { method: "DELETE" }).then((res) => {
        if (res.ok) {
          cargarTabla(categoria);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Borrado",
            showConfirmButton: false,
            timer: 2000,
          });
        } else {
          Swal.fire(
            "Error",
            "No se puede eliminar porque ya está asignado a un paciente.",
            "error",
          );
        }
      });
    }
  });
}
