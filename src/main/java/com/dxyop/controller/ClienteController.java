package com.dxyop.controller;

import com.dxyop.dto.ClienteDto;
import com.dxyop.model.Cliente;
//import com.dxyop.model.ClientePotencial;
import com.dxyop.service.ClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Para que JS de frontend pueda llamar
public class ClienteController {

    private final ClienteService service;

    @GetMapping
    public List<ClienteDto> getAll() {
        return service.getAllClientes().stream()
                .map(cliente -> {
                    // Creamos el DTO
                    ClienteDto dto = new ClienteDto();
                    
                    // Llenamos los datos básicos
                    dto.setId(cliente.getId());
                    dto.setNombre(cliente.getNombre());
                    dto.setTelefono(cliente.getTelefono());
                    dto.setEmail(cliente.getEmail());
                    
                    // ⭐ AQUÍ AGREGAMOS LO QUE FALTABA ⭐
                    dto.setFechaRegistro(cliente.getFechaRegistro());
                    dto.setFechaNacimiento(cliente.getFechaNacimiento());
                    dto.setMotivo(cliente.getMotivo());
                    dto.setGraduacionActual(cliente.getGraduacionActual());
                    
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> getById(@PathVariable Long id) {
        Cliente cliente = service.getClienteById(id);
        return cliente != null ? ResponseEntity.ok(cliente) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public Cliente create(@RequestBody Cliente cliente) {
        return service.saveCliente(cliente);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> update(@PathVariable Long id, @RequestBody Cliente cliente) {
        cliente.setId(id);
        Cliente updated = service.saveCliente(cliente);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteCliente(id);
        return ResponseEntity.ok().build();
    }

    /*@PostMapping("/potenciales")
    @ResponseBody
    public ClientePotencial savePotencial(@RequestBody ClientePotencial potencial) {
        return service.save(potencial);
    }*/

}
