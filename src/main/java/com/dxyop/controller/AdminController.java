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

    @GetMapping({"", "/"})
    public String adminIndex() {
        return "redirect:/admin/citas"; 
    }

    // ==========================================
    // MÓDULOS DEL SISTEMA
    // ==========================================
    
    @GetMapping("/citas")
    public String citas(Model model) {
        model.addAttribute("titulo", "Agenda de Citas");
        return "admin/citas";
    }

    @GetMapping("/ventas")
    public String ventas(Model model) {
        model.addAttribute("titulo", "Ventas y Finanzas"); // Aquí ahora vive el Dashboard
        return "admin/ventas";  
    }

    @GetMapping("/pacientes")
    public String pacientes(Model model) {
        model.addAttribute("titulo", "Gestión de Pacientes");
        return "admin/pacientes"; 
    }

    @GetMapping("/potenciales")
    public String potenciales(Model model) {
        model.addAttribute("titulo", "Clientes Potenciales");
        return "admin/clientes"; 
    }

    @GetMapping("/productos")
    public String productos(Model model) {
        model.addAttribute("titulo", "Gestión de Productos");
        return "admin/productos";
    }

    @GetMapping("/configuracion")
    public String configuracion(Model model) {
        model.addAttribute("titulo", "Configuración");
        return "admin/configuracion";  
    }

    // ==========================================
    // ENDPOINTS PARA JAVASCRIPT (PACIENTES)
    // ==========================================
    @GetMapping("/pacientes/{id}")
    @ResponseBody
    public Paciente getPacienteById(@PathVariable Long id) {
        return service.getPacienteById(id); 
    }

    @PostMapping("/pacientes")
    @ResponseBody
    public Paciente savePaciente(@RequestBody Paciente paciente) {
        return service.savePaciente(paciente); 
    }

    @DeleteMapping("/pacientes/{id}")
    @ResponseBody
    public void deletePaciente(@PathVariable Long id) {
        service.deletePaciente(id); 
    }
}