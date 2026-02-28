package com.dxyop.controller;

import com.dxyop.model.ConfiguracionGeneral;
import com.dxyop.repository.ConfiguracionGeneralRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
@RequiredArgsConstructor
public class GlobalControllerAdvice {

    private final ConfiguracionGeneralRepository configRepo;

    // Esto inyecta la variable "appConfig" en TODAS las pantallas HTML automáticamente
    @ModelAttribute("appConfig")
    public ConfiguracionGeneral getGlobalConfig() {
        return configRepo.findById(1L).orElse(new ConfiguracionGeneral());
    }
}