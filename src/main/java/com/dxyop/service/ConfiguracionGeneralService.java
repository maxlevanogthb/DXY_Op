package com.dxyop.service;

import com.dxyop.model.ConfiguracionGeneral;
import com.dxyop.repository.ConfiguracionGeneralRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConfiguracionGeneralService {

    private final ConfiguracionGeneralRepository repository;

    // Método para obtener la configuración global
    public ConfiguracionGeneral obtenerConfiguracion() {
        List<ConfiguracionGeneral> configs = repository.findAll();
        
        // Si hay configuración guardada, trae la primera. Si no, crea una vacía temporal.
        if (!configs.isEmpty()) {
            return configs.get(0);
        } else {
            return new ConfiguracionGeneral(); 
        }
    }
}