package com.dxyop.controller;

import com.dxyop.model.Paciente;
import com.dxyop.service.PacienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PacienteService service;

    // Dashboard principal
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("titulo", "Dashboard Óptica DXY");
        model.addAttribute("totalClientes", service.getAllClientes().size());
        return "admin/dashboard";
    }

    // Lista clientes (tabla principal)
    @GetMapping("/clientes")
    public String clientes(Model model) {
        model.addAttribute("titulo", "Gestión de Pacientes");
        return "admin/clientes";
    }

    // Form nuevo cliente (modal usa POST directo)
    @GetMapping("/clientes/nuevo")
    public String nuevoCliente(Model model) {
        model.addAttribute("cliente", new Paciente());
        model.addAttribute("titulo", "Nuevo Paciente");
        return "admin/cliente-form";
    }

    // API endpoint para EDITAR (usado por JS)
    @GetMapping("/clientes/{id}")
    @ResponseBody
    public Paciente getClienteById(@PathVariable Long id) {
        return service.getClienteById(id);
    }

    // Guardar/Actualizar cliente (usado por formulario JS)
    @PostMapping("/clientes")
    @ResponseBody
    public Paciente saveCliente(@RequestBody Paciente cliente) {
        return service.saveCliente(cliente);
    }

    // Eliminar cliente (usado por JS)
    @DeleteMapping("/clientes/{id}")
    @ResponseBody
    public void deleteCliente(@PathVariable Long id) {
        service.deleteCliente(id);
    }

    // Placeholder productos (futuro)
    @GetMapping("/productos")
    public String productos(Model model) {
        model.addAttribute("titulo", "Gestión de Productos");
        return "admin/productos";
    }

    // Placeholder citas (futuro)
    @GetMapping("/citas")
    public String citas(Model model) {
        model.addAttribute("titulo", "Agenda de Citas");
        return "admin/citas";
    }

    @GetMapping("/pacientes")
    public String pacientes(Model model) {
        model.addAttribute("titulo", "Pacientes Leales");
        return "admin/pacientes";
    }

     @GetMapping("/configuracion")
    public String configuracion(Model model) {
        model.addAttribute("titulo", "Configuracion");
        return "admin/configuracion";  
    }

    @GetMapping("/ventas")
    public String ventas(Model model) {
        model.addAttribute("titulo", "Ventas");
        return "admin/ventas";  
    }

    

}
