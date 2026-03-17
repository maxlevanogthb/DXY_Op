const API_TIPOS = "/api/tipos-producto";
const API_RAZONES = "/api/razones-visita";
const API_USUARIOS = '/api/usuarios';
const API_CONFIG_GENERAL = '/api/configuracion';

let modalRazonInstance;
let modalUsuarioInstance;
let tablaTipos;
let modalTipoInstancia;

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("tablaTipos")) {
    inicializarTablaTipos();

    $("#tipoIcono").on("change", previewIcono);
    $("#buscarTipo").on("keyup", function () {
      tablaTipos.search(this.value).draw();
    });

    const elTipo = document.getElementById("modalTipo");
    if (elTipo) {
      modalTipoInstancia = new bootstrap.Modal(elTipo, {
        backdrop: "static",
        keyboard: false,
      });
    }
  }
  const elRazon = document.getElementById("modalRazon");
  if (elRazon) {
    modalRazonInstance = new bootstrap.Modal(elRazon);
  }
  if (document.getElementById("tablaRazones")) {
    cargarTablaRazones();
  }
  const elUsuario = document.getElementById("modalUsuario");
  if (elUsuario) {
    modalUsuarioInstance = new bootstrap.Modal(elUsuario);
  }

  if (document.getElementById("tbodyUsuarios")) {
    cargarTablaUsuarios();
  }
  if(document.getElementById('confNombre')) {
        cargarConfiguracionGeneral();
    }
});

function inicializarTablaTipos() {
  tablaTipos = $("#tablaTipos").DataTable({
    ajax: {
      url: API_TIPOS,
      dataSrc: "",
    },
    columns: [
      { data: "id", className: "text-center fw-bold small", width: "60px" },
      { data: "nombre", className: "fw-semibold" },
      { data: "descripcion", defaultContent: "-" },
      {
        data: "icono",
        render: (icono) =>
          icono ? `<i class="${icono} fa-lg text-primary"></i>` : "-",
        width: "80px",
        className: "text-center",
      },
      {
        data: null,
        orderable: false,
        className: "text-center",
        render: (data) => `
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editarTipo(${data.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success me-1" onclick="duplicarTipo(${data.id})" title="Duplicar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarTipo(${data.id})" title="Eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `,
      },
    ],
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json",
    },
    pageLength: 10, // Ajustado a 10 por defecto
    responsive: true,
    dom: "rtip", // Oculta el buscador nativo de DataTables
  });
}

function previewIcono() {
  const icono = $("#tipoIcono").val();
  $("#iconoPreview").html(`<i class="${icono} fa-2x text-primary"></i>`);
}

function abrirModalTipo(editar = false, tipoData = null) {
  const form = document.getElementById("formTipo");

  if (!form) {
    console.error("❌ Error crítico: No se encuentra el formulario #formTipo");
    return;
  }

  form.reset(); 
  $("#tipoId").val(""); 

  if (editar && tipoData) {
    $("#tipoId").val(tipoData.id);
    $("#tipoNombre").val(tipoData.nombre);
    $("#tipoDescripcion").val(tipoData.descripcion || "");
    $("#tipoIcono").val(tipoData.icono || "");
    $("#modalTipoTitulo").text(`Editar: ${tipoData.nombre}`);
  } else {
    // Preparar para nuevo registro
    $("#modalTipoTitulo").text("Nuevo Tipo Producto");
  }

  previewIcono(); // Actualizar preview
  modalTipoInstancia.show(); // Usar la instancia global
}

function editarTipo(id) {
  fetch(`${API_TIPOS}/${id}`)
    .then((res) => {
      if (!res.ok) throw new Error("No se pudo cargar el tipo");
      return res.json();
    })
    .then((tipo) => abrirModalTipo(true, tipo))
    .catch((err) => Swal.fire("Error", err.message, "error"));
}

function duplicarTipo(id) {
  fetch(`${API_TIPOS}/${id}`)
    .then((res) => res.json())
    .then((tipo) => {
      const duplicado = {
        ...tipo,
        id: null, // ID nulo para crear uno nuevo
        nombre: `${tipo.nombre} (Copia)`,
      };
      abrirModalTipo(true, duplicado);
      // enfocar el nombre para que el usuario lo cambie rápido
      setTimeout(() => $("#tipoNombre").focus().select(), 500);
    })
    .catch(() =>
      Swal.fire(
        "Error",
        "No se pudieron cargar los datos para duplicar",
        "error",
      ),
    );
}

function guardarTipo() {
  const form = document.getElementById("formTipo");

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  //Feedback visual y bloqueo de botón (Anti-spam click)
  const btnGuardar = document.querySelector(
    "#modalTipo .modal-footer .btn-success",
  );
  const textoOriginal = btnGuardar.innerText;
  btnGuardar.disabled = true;
  btnGuardar.innerText = "Guardando..."; 

  const id = $("#tipoId").val();
  const tipoData = {
    id: id ? parseInt(id) : null,
    nombre: $("#tipoNombre").val().trim(),
    descripcion: $("#tipoDescripcion").val().trim() || null,
    icono: $("#tipoIcono").val().trim() || null,
  };

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_TIPOS}/${id}` : API_TIPOS;

  fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tipoData),
  })
    .then(async (res) => {
      if (res.ok) {
        modalTipoInstancia.hide(); // Cerrar modal
        tablaTipos.ajax.reload(null, false); // Recargar tabla sin perder paginación

        Swal.fire({
          icon: "success",
          title: "¡Listo!",
          text: `${id ? "Actualizado" : "Creado"} correctamente`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // Intentar leer mensaje de error del backend
        const errorText = await res.text();
        throw new Error(errorText || `Error HTTP ${res.status}`);
      }
    })
    .catch((err) => {
      console.error(err);
      Swal.fire("Error", "No se pudo guardar: " + err.message, "error");
    })
    .finally(() => {
      // Restaurar botón siempre
      btnGuardar.disabled = false;
      btnGuardar.innerText = textoOriginal;
    });
}

function eliminarTipo(id) {
  Swal.fire({
    title: "¿Estás seguro?",
    html: "Esta acción podría afectar productos asociados si no tienes validación de integridad.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    confirmButtonColor: "#dc3545",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${API_TIPOS}/${id}`, { method: "DELETE" })
        .then(async (res) => {
          if (res.ok) {
            tablaTipos.ajax.reload(null, false);
            Swal.fire("Eliminado", "El registro ha sido eliminado.", "success");
          } else {
            const errorText = await res.text();
            throw new Error(errorText || "Error al eliminar");
          }
        })
        .catch((err) => Swal.fire("Error", err.message, "error"));
    }
  });
}

// ==========================================
// RAZONES DE VISITA
// ==========================================

function cargarTablaRazones() {
  fetch(API_RAZONES)
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById("tbodyRazones");
      if (!tbody) return;
      tbody.innerHTML = "";

      data.forEach((r) => {
        // Lógica para mostrar insignias
        const badgeCat = r.categoria === "CONSULTA"
            ? '<span class="badge bg-primary">Consulta</span>'
            : '<span class="badge bg-secondary">Cita</span>';

        const colorDot = `<span style="display:inline-block; width:15px; height:15px; border-radius:50%; background-color:${r.colorHex || "#0d6efd"}; border:1px solid #ccc;"></span>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td class="fw-bold">${r.nombre}</td>
                    <td class="text-center">${badgeCat}</td>
                    <td class="text-center">${colorDot}</td>
                    <td class="text-center">
                        <div class="btn-group shadow-sm">
                            <button class="btn btn-sm btn-outline-warning me-1" onclick="editarRazon(${r.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarRazon(${r.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
        tbody.appendChild(tr);
      });
    })
    .catch((err) => console.error("Error cargando razones:", err));
}

function abrirModalRazon() {
  // Limpiamos todos los campos antes de abrir 
  if(document.getElementById("razonId")) document.getElementById("razonId").value = "";
  document.getElementById("razonNombre").value = "";
  document.getElementById("razonCategoria").value = "CONSULTA"; 
  document.getElementById("razonColor").value = "#0d6efd"; 

  if (modalRazonInstance) modalRazonInstance.show();
}

function editarRazon(id) {
    fetch(`${API_RAZONES}/${id}`)
        .then(res => {
            if(!res.ok) throw new Error("Error al cargar la información");
            return res.json();
        })
        .then(razon => {
            // Llenamos el modal con los datos de la base de datos
            document.getElementById("razonId").value = razon.id;
            document.getElementById("razonNombre").value = razon.nombre;
            document.getElementById("razonCategoria").value = razon.categoria || "CONSULTA";
            document.getElementById("razonColor").value = razon.colorHex || "#0d6efd";
            
            // Abrimos el modal
            if (modalRazonInstance) modalRazonInstance.show();
        })
        .catch(err => Swal.fire('Error', err.message, 'error'));
}

function guardarRazon() {
  const id = document.getElementById("razonId").value; // Verificamos si hay ID oculto
  const nombre = document.getElementById("razonNombre").value.trim();
  const categoria = document.getElementById("razonCategoria").value;
  const colorHex = document.getElementById("razonColor").value;

  if (!nombre) {
    Swal.fire("Atención", "Escribe un nombre para el motivo", "warning");
    return;
  }

  const data = {
    nombre: nombre,
    categoria: categoria,
    colorHex: colorHex,
  };

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_RAZONES}/${id}` : API_RAZONES;

  fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (res.ok) {
        modalRazonInstance.hide();
        cargarTablaRazones();
        Swal.fire({
          icon: "success",
          title: "Guardado",
          text: `El motivo se ha ${id ? "actualizado" : "agregado"} correctamente.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", "No se pudo guardar", "error");
      }
    })
    .catch((err) => console.error(err));
}

function eliminarRazon(id) {
  Swal.fire({
    title: "¿Eliminar motivo?",
    text: "Ya no aparecerá en las opciones para nuevas consultas.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${API_RAZONES}/${id}`, { method: "DELETE" }).then((res) => {
        if (res.ok) {
          cargarTablaRazones();
          Swal.fire("Eliminado", "", "success");
        }
      });
    }
  });
}

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================

function cargarTablaUsuarios() {
  fetch(API_USUARIOS)
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById("tbodyUsuarios");
      tbody.innerHTML = "";

      data.forEach((u) => {
        const badgeRol =
          u.rol === "ROLE_ADMIN"
            ? '<span class="badge bg-danger">Administrador</span>'
            : '<span class="badge bg-info text-dark">Recepción</span>';

        tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">${u.nombreCompleto}</td>
                        <td><i class="fas fa-user-circle text-muted me-2"></i>${u.username}</td>
                        <td class="text-center">${badgeRol}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario(${u.id})" title="Desactivar Cuenta">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
      });
    })
    .catch((err) => console.error(err));
}

function abrirModalUsuario() {
  document.getElementById("usuarioId").value = "";
  document.getElementById("usuarioNombre").value = "";
  document.getElementById("usuarioUsername").value = "";
  document.getElementById("usuarioPassword").value = "";
  document.getElementById("usuarioRol").value = "ROLE_RECEPCION";
  modalUsuarioInstance.show();
}

function guardarUsuario() {
  const id = document.getElementById("usuarioId").value;
  const data = {
    nombreCompleto: document.getElementById("usuarioNombre").value,
    username: document.getElementById("usuarioUsername").value,
    password: document.getElementById("usuarioPassword").value,
    rol: document.getElementById("usuarioRol").value,
  };

  fetch(API_USUARIOS + (id ? `/${id}` : ""), {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => {
    if (res.ok) {
      modalUsuarioInstance.hide();
      cargarTablaUsuarios();
      Swal.fire("Guardado", "Usuario registrado", "success");
    } else {
      Swal.fire(
        "Error",
        "El nombre de usuario ya existe o hubo un error",
        "error",
      );
    }
  });
}

function eliminarUsuario(id) {
  Swal.fire({
    title: "¿Revocar acceso?",
    text: "Este usuario ya no podrá iniciar sesión.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sí, eliminar",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${API_USUARIOS}/${id}`, { method: "DELETE" }).then(() =>
        cargarTablaUsuarios(),
      );
    }
  });
}

// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================

// Variables para almacenar las imágenes convertidas
let base64Sistema = null;
let base64Izq = null;
let base64Der = null;

function aplicarReglasApariencia() {
    const selectTema = document.getElementById('confColorTema');
    const switchOscuro = document.getElementById('confModoOscuro');
    
    if (!selectTema || !switchOscuro) return;

    // Si elige Gris Ejecutivo (#212529) -> Apagar y bloquear Modo Oscuro
    if (selectTema.value === '#212529') {
        switchOscuro.checked = false;
        switchOscuro.disabled = true;
    } else {
        switchOscuro.disabled = false;
    }

    // Si activa Modo Oscuro -> Bloquear la opción Gris Ejecutivo
    for (let i = 0; i < selectTema.options.length; i++) {
        if (selectTema.options[i].value === '#212529') {
            selectTema.options[i].disabled = switchOscuro.checked;
            if (switchOscuro.checked && selectTema.value === '#212529') {
                selectTema.value = '#0d6efd'; 
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('confNombre')) {
        cargarConfiguracionGeneral();
        
        const selectTema = document.getElementById('confColorTema');
        const switchOscuro = document.getElementById('confModoOscuro');
        
        if (selectTema && switchOscuro) {
            selectTema.addEventListener('change', aplicarReglasApariencia);
            switchOscuro.addEventListener('change', aplicarReglasApariencia);
        }
    }
});
// leer la imagen y convertirla a texto Base64
function convertirImagenABase64(event, previewId, variableGlobal) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Mostrar la vista previa
            const imgEl = document.getElementById(previewId);
            imgEl.src = e.target.result;
            imgEl.classList.remove('d-none');
            
            // Guardar en la variable correspondiente
            if(variableGlobal === 'base64Sistema') base64Sistema = e.target.result;
            if(variableGlobal === 'base64Izq') base64Izq = e.target.result;
            if(variableGlobal === 'base64Der') base64Der = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function cargarConfiguracionGeneral() {
    fetch(API_CONFIG_GENERAL)
        .then(res => res.json())
        .then(data => {
            document.getElementById('confNombre').value = data.nombreComercial || '';
            document.getElementById('confRfc').value = data.rfc || '';
            document.getElementById('confTelefono').value = data.telefonoPrincipal || '';
            document.getElementById('confDireccion').value = data.direccionCorta || '';
            document.getElementById('confFacebook').value = data.facebook || '';
            document.getElementById('confInstagram').value = data.instagram || '';
            
            if(data.horaApertura) document.getElementById('confApertura').value = data.horaApertura.substring(0, 5);
            if(data.horaCierre) document.getElementById('confCierre').value = data.horaCierre.substring(0, 5);
            
            document.getElementById('confDuracion').value = data.duracionCitaMinutos || 60;
            document.getElementById('confImpuesto').value = data.porcentajeImpuesto || 0;
            document.getElementById('confMensaje').value = data.mensajeTicket || '';

            document.getElementById('confCorreo').value = data.correoRemitente || '';
            document.getElementById('confPasswordCorreo').value = data.passwordCorreo || '';

            // Textos Landing Page
            document.getElementById('confTextoHero').value = data.textoHero || '';
            document.getElementById('confSubtituloHero').value = data.subtituloHero || '';
            document.getElementById('confNosotros').value = data.descripcionNosotros || '';
            
            //Comision tarjeta
            document.getElementById('confComision').value = data.porcentajeComisionTarjeta || 0;

            // Cargar miniaturas de los logos si existen en la BD
            if(data.logoSistema) {
                base64Sistema = data.logoSistema;
                document.getElementById('previewSistema').src = data.logoSistema;
                document.getElementById('previewSistema').classList.remove('d-none');
            }
            if(data.logoRecetaIzq) {
                base64Izq = data.logoRecetaIzq;
                document.getElementById('previewIzq').src = data.logoRecetaIzq;
                document.getElementById('previewIzq').classList.remove('d-none');
            }
            if(data.logoRecetaDer) {
                base64Der = data.logoRecetaDer;
                document.getElementById('previewDer').src = data.logoRecetaDer;
                document.getElementById('previewDer').classList.remove('d-none');
            }
            // Cargar Apariencia
            document.getElementById('confColorTema').value = data.colorTema || '#0d6efd';
            document.getElementById('confModoOscuro').checked = data.modoOscuro || false;
            
            aplicarReglasApariencia();
            
            // Por si es la primera vez que inicia sesión en un equipo nuevo, sincronizamos el localstorage
            localStorage.setItem('dxy_color', data.colorTema || '#0d6efd');
            localStorage.setItem('dxy_dark', data.modoOscuro || false);
        })
        .catch(err => console.error("Error cargando configuración:", err));
}

function guardarConfiguracionGeneral() {
    const btn = document.querySelector('#global .btn-success');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando...';
    btn.disabled = true;

    const configData = {
        nombreComercial: document.getElementById('confNombre').value,
        rfc: document.getElementById('confRfc').value,
        telefonoPrincipal: document.getElementById('confTelefono').value,
        direccionCorta: document.getElementById('confDireccion').value,
        facebook: document.getElementById('confFacebook').value,
        instagram: document.getElementById('confInstagram').value,
        horaApertura: document.getElementById('confApertura').value || null,
        horaCierre: document.getElementById('confCierre').value || null,
        duracionCitaMinutos: parseInt(document.getElementById('confDuracion').value),
        porcentajeImpuesto: parseFloat(document.getElementById('confImpuesto').value),
        mensajeTicket: document.getElementById('confMensaje').value,
        correoRemitente: document.getElementById('confCorreo').value,
        passwordCorreo: document.getElementById('confPasswordCorreo').value,
        textoHero: document.getElementById('confTextoHero').value,
        subtituloHero: document.getElementById('confSubtituloHero').value,
        descripcionNosotros: document.getElementById('confNosotros').value,
        porcentajeComisionTarjeta: parseFloat(document.getElementById('confComision').value) || 0,
        // Mandamos los logos en texto
        logoSistema: base64Sistema,
        logoRecetaIzq: base64Izq,
        logoRecetaDer: base64Der,
        colorTema: document.getElementById('confColorTema').value,
        modoOscuro: document.getElementById('confModoOscuro').checked
    };

    fetch(API_CONFIG_GENERAL, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
    })
    .then(res => {
        if(res.ok) {
            localStorage.setItem('dxy_color', configData.colorTema);
            localStorage.setItem('dxy_dark', configData.modoOscuro);
            Swal.fire({
                icon: 'success',
                title: 'Ajustes guardados',
                text: 'La configuración ha sido actualizada.',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                // Refrescamos la página para que el logo del menú superior cambie al instante
                window.location.reload(); 
            });
        } else {
            throw new Error("Error en el servidor");
        }
    })
    .catch(err => Swal.fire('Error', 'No se pudieron guardar los ajustes', 'error'))
    .finally(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = "password";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ====================================================================
// ACTUALIZACIÓN MASIVA V2.0
// ====================================================================
function ejecutarActualizacionMasiva() {
    Swal.fire({
        title: '¿Actualizar catálogo antiguo?',
        html: `Esta acción buscará todos los productos y opciones clínicas que <b>no tengan un costo base registrado</b>.<br><br>Asignará su precio actual como costo y le sumará la comisión global.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="fas fa-bolt text-dark"></i> Sí, actualizar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Procesando...', html: 'Recalculando precios y comisiones...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

            fetch('/api/configuracion/aplicar-comision-masiva', { method: 'POST' })
            .then(async res => {
                if (res.ok) return res.json();
                throw new Error(await res.text());
            })
            .then(data => {
                Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Productos actualizados.', confirmButtonColor: '#198754' });
                if(typeof cargarTabla === "function") cargarTabla(document.getElementById('categoriaActual').value);
            })
            .catch(err => Swal.fire('Error', err.message, 'error'));
        }
    });
}