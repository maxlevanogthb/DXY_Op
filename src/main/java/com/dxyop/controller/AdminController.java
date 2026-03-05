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
        // CORREGIDO: Llamamos a getAllPacientes()
        model.addAttribute("totalPacientes", service.getAllPacientes().size()); 
        return "admin/dashboard";
    }

    // ==========================================
    // UNIFICACIÓN: Todo es "Pacientes" ahora
    // ==========================================
    @GetMapping("/pacientes")
    public String pacientes(Model model) {
        model.addAttribute("titulo", "Gestión de Pacientes");
        return "admin/pacientes"; // ⚠️ OJO: Asegúrate de tener un archivo llamado pacientes.html
    }

    @GetMapping("/pacientes/nuevo")
    public String nuevoPaciente(Model model) {
        model.addAttribute("paciente", new Paciente());
        model.addAttribute("titulo", "Nuevo Paciente");
        return "admin/paciente-form"; // ⚠️ OJO: Renombra tu HTML a paciente-form.html
    }

    // ==========================================
    // ENDPOINTS PARA JAVASCRIPT (CORREGIDOS)
    // ==========================================
    @GetMapping("/pacientes/{id}")
    @ResponseBody
    public Paciente getPacienteById(@PathVariable Long id) {
        return service.getPacienteById(id); // CORREGIDO
    }

    @PostMapping("/pacientes")
    @ResponseBody
    public Paciente savePaciente(@RequestBody Paciente paciente) {
        return service.savePaciente(paciente); // CORREGIDO
    }

    @DeleteMapping("/pacientes/{id}")
    @ResponseBody
    public void deletePaciente(@PathVariable Long id) {
        service.deletePaciente(id); // CORREGIDO
    }

    // ==========================================
    // LAS DEMÁS VISTAS
    // ==========================================
    @GetMapping("/productos")
    public String productos(Model model) {
        model.addAttribute("titulo", "Gestión de Productos");
        return "admin/productos";
    }

    @GetMapping("/citas")
    public String citas(Model model) {
        model.addAttribute("titulo", "Agenda de Citas");
        return "admin/citas";
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