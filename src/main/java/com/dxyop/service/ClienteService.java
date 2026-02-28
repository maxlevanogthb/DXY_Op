package com.dxyop.service;

import com.dxyop.model.Cliente;
import com.dxyop.model.ClientePotencial;
import com.dxyop.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository repository;

    public List<Cliente> getAllClientes() {
        List<Cliente> clientes = repository.findAllActivos();
        // Null listas
        clientes.forEach(c -> c.setConsultas(null));
        return clientes;
    }

    public Cliente getClienteById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Cliente saveCliente(Cliente cliente) {
        return repository.save(cliente);
    }

    public void deleteCliente(Long id) {
        Cliente cliente = getClienteById(id);
        if (cliente != null) {
            cliente.setActivo(false);
            repository.save(cliente);
        }
    }

    public List<Cliente> searchClientes(String nombre) {
        return repository.findByNombreContainingIgnoreCase(nombre);
    }

}
