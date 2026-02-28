const API_URL = '/api/catalogo'; // Nota: Necesitaremos un endpoint POST/DELETE en tu controller

document.addEventListener('DOMContentLoaded', () => {
    cargarTabla('MATERIAL'); // Cargar la primera pestaña por defecto
});

// 1. Cargar datos según la categoría seleccionada
function cargarTabla(categoria) {
    document.getElementById('categoriaActual').value = categoria;
    const tbody = document.getElementById('tablaCuerpo');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';

    fetch(`${API_URL}/lentes?categoria=${categoria}`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay opciones registradas</td></tr>';
                return;
            }

            data.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td>${item.nombre}</td>
                        <td class="fw-bold text-success">$${item.precioBase.toFixed(2)}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarOpcion(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        });
}

// 2. Guardar Nueva Opción
function guardarOpcion() {
    const categoria = document.getElementById('categoriaActual').value;
    const nombre = document.getElementById('nuevoNombre').value;
    const precio = document.getElementById('nuevoPrecio').value;

    if (!nombre || !precio) {
        Swal.fire('Atención', 'Nombre y Precio son obligatorios', 'warning');
        return;
    }

    const data = {
        categoria: categoria,
        nombre: nombre,
        precioBase: precio
    };

    fetch(`${API_URL}/opcion`, { // OJO: Necesitas crear este endpoint POST
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (res.ok) {
            document.getElementById('nuevoNombre').value = '';
            document.getElementById('nuevoPrecio').value = '';
            cargarTabla(categoria); // Recargar tabla
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            Toast.fire({ icon: 'success', title: 'Guardado' });
        } else {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    });
}

// 3. Eliminar Opción
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
            fetch(`${API_URL}/opcion/${id}`, { method: 'DELETE' }) // OJO: Necesitas este endpoint DELETE
                .then(res => {
                    if (res.ok) {
                        cargarTabla(categoria);
                        Swal.fire('Borrado', '', 'success');
                    }
                });
        }
    });
}