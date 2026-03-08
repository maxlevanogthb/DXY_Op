// Actualizado para coincidir con tu OpcionLenteController
const API_URL = '/api/opciones-lente'; 

document.addEventListener('DOMContentLoaded', () => {
    cargarTabla('MATERIAL'); // Cargar la primera pestaña por defecto
});

// 1. Cargar datos según la categoría seleccionada
function cargarTabla(categoria) {
    document.getElementById('categoriaActual').value = categoria;
    
    // Limpiar si había algo a medias al cambiar de pestaña
    cancelarEdicionOpcion(); 

    const tbody = document.getElementById('tablaCuerpo');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';

    fetch(`${API_URL}?categoria=${categoria}`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No hay opciones registradas</td></tr>';
                return;
            }

            data.forEach(item => {
                const precioF = item.precioBase ? `$${parseFloat(item.precioBase).toFixed(2)}` : '$0.00';
                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">${item.nombre}</td>
                        <td class="fw-bold text-success">${precioF}</td>
                        <td class="text-end">
                            <div class="btn-group">
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
        .catch(err => console.error("Error al cargar la tabla", err));
}

// 2. Guardar (Crear o Actualizar)
function guardarOpcion() {
    const id = document.getElementById('nuevoId').value;
    const categoria = document.getElementById('categoriaActual').value;
    const nombre = document.getElementById('nuevoNombre').value.trim();
    const precio = document.getElementById('nuevoPrecio').value;

    if (!nombre) {
        Swal.fire('Atención', 'El nombre es obligatorio', 'warning');
        return;
    }

    const data = {
        categoria: categoria,
        nombre: nombre,
        precioBase: precio ? parseFloat(precio) : 0.00
    };

    // Lógica inteligente: PUT si hay ID, POST si es nuevo
    const url = id ? `${API_URL}/${id}` : API_URL;
    const metodo = id ? 'PUT' : 'POST';

    fetch(url, { 
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (res.ok) {
            Swal.fire({
                toast: true, position: 'top-end', icon: 'success', 
                title: id ? 'Actualizado correctamente' : 'Guardado correctamente', 
                showConfirmButton: false, timer: 2000
            });
            cancelarEdicionOpcion(); // Limpiamos los inputs
            cargarTabla(categoria); // Recargar tabla
        } else {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    });
}

// 3. NUEVA FUNCIÓN: Cargar datos para editar
function editarOpcion(id) {
    fetch(`${API_URL}/${id}`)
        .then(res => res.json())
        .then(opcion => {
            // Subir datos a los inputs
            document.getElementById('nuevoId').value = opcion.id;
            document.getElementById('nuevoNombre').value = opcion.nombre;
            document.getElementById('nuevoPrecio').value = opcion.precioBase;

            // Cambiar UI del botón
            const btnGuardar = document.getElementById('btnGuardarOpcion');
            if(btnGuardar) {
                btnGuardar.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Actualizar Cambios';
                btnGuardar.classList.remove('btn-success');
                btnGuardar.classList.add('btn-warning');
            }
            
            // Mostrar botón cancelar
            const btnCancelar = document.getElementById('btnCancelarEdicion');
            if(btnCancelar) btnCancelar.classList.remove('d-none');
            
            // Hacer focus
            document.getElementById('nuevoNombre').focus();
        });
}

// 4. NUEVA FUNCIÓN: Limpiar inputs y restaurar botones
function cancelarEdicionOpcion() {
    const inputId = document.getElementById('nuevoId');
    if(inputId) inputId.value = '';
    
    const inputNombre = document.getElementById('nuevoNombre');
    if(inputNombre) inputNombre.value = '';
    
    const inputPrecio = document.getElementById('nuevoPrecio');
    if(inputPrecio) inputPrecio.value = '';
    
    // Restaurar UI original
    const btnGuardar = document.getElementById('btnGuardarOpcion');
    if(btnGuardar) {
        btnGuardar.innerHTML = '<i class="fas fa-plus me-2"></i>Agregar al Catálogo';
        btnGuardar.classList.remove('btn-warning');
        btnGuardar.classList.add('btn-success');
    }
    
    const btnCancelar = document.getElementById('btnCancelarEdicion');
    if(btnCancelar) btnCancelar.classList.add('d-none');
}

// 5. Eliminar Opción
function eliminarOpcion(id) {
    Swal.fire({
        title: '¿Eliminar?',
        text: "Esta opción dejará de aparecer en nuevas consultas.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, borrar'
    }).then((result) => {
        if (result.isConfirmed) {
            const categoria = document.getElementById('categoriaActual').value;
            fetch(`${API_URL}/${id}`, { method: 'DELETE' })
                .then(res => {
                    if (res.ok) {
                        cargarTabla(categoria);
                        Swal.fire({toast:true, position:'top-end', icon:'success', title:'Borrado', showConfirmButton:false, timer:2000});
                    } else {
                        Swal.fire('Error', 'No se puede eliminar porque ya está asignado a un paciente.', 'error');
                    }
                });
        }
    });
}