package com.dxyop.security;

import com.dxyop.model.Usuario;
import com.dxyop.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Si la tabla de usuarios está vacía, creamos los usuarios base
            if (repository.count() == 0) {
                // 1. El Super Administrador (El Doctor)
                Usuario admin = new Usuario();
                admin.setNombreCompleto("Doctor Administrador");
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRol("ROLE_ADMIN");
                admin.setActivo(true);
                repository.save(admin);
                
                // 2. La Recepcionista (Asistente)
                Usuario recepcion = new Usuario();
                recepcion.setNombreCompleto("Asistente Recepción");
                recepcion.setUsername("recepcion");
                recepcion.setPassword(passwordEncoder.encode("recepcion123"));
                recepcion.setRol("ROLE_RECEPCION");
                recepcion.setActivo(true);
                repository.save(recepcion);

                System.out.println("✅ USUARIOS CREADOS:");
                System.out.println("   - Admin: admin / admin123");
                System.out.println("   - Recepción: recepcion / recepcion123");
            }
        };
    }
}