// Lógica para el menú móvil
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
}

function closeMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
    }
}

// Lógica para pre-seleccionar producto en el formulario
function selectProduct(productName) {
    // Scroll suave al formulario
    document.getElementById('cita').scrollIntoView({ behavior: 'smooth' });

    // Llenar el textarea con el interés
    const mensajeInput = document.getElementById('mensaje');
    mensajeInput.value = "Estoy interesado en más información sobre: " + productName + ".";

    // Cambiar el select a "Compra de lentes" si aplica
    const motivoSelect = document.getElementById('motivo');
    motivoSelect.value = "Compra de lentes";

    // Enfocar el campo nombre para empezar a escribir
    setTimeout(() => {
        document.getElementById('nombre').focus();
    }, 800);
}

// Envío de formulario
// Reemplaza tu función submitForm ACTUAL con esta:
async function submitForm(event) {
    event.preventDefault();
    
    const btn = document.querySelector('.submit-btn');
    const originalText = btn.innerText;
    
    // Tu animación de carga (mantenida)
    btn.innerText = "Enviando...";
    btn.disabled = true;
    btn.style.opacity = "0.7";
    
    // NUEVA: Recoger datos del formulario
    const formData = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value, // Se actualiza en consulta
        motivo: document.getElementById('motivo').value, // Motivo de cita
        mensaje: document.getElementById('mensaje').value
    };
    
    try {
        // NUEVA: ENVIAR A TU API /api/clientes
        const response = await fetch('/api/potenciales', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Tu UX de éxito (mantenida)
            document.getElementById('bookingForm').reset();
            btn.innerText = originalText;
            btn.disabled = false;
            btn.style.opacity = "1";
            
            const successMsg = document.getElementById('successMessage');
            successMsg.innerHTML = "¡Registro Exitoso!";
            successMsg.style.display = 'block';
            
            // Ocultar mensaje (mantenido)
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 5000);
        } else {
            throw new Error('Error del servidor');
        }
    } catch (error) {
        // Manejo de errores (UX suave)
        btn.innerText = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
        alert('Error conectando: ' + error.message + '\nRevisa que la app esté corriendo');
        console.error(error);
    }
}

