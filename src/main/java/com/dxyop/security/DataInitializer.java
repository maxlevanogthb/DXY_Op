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
            // Si la tabla de usuarios está vacía, creamos el super usuario
            if (repository.count() == 0) {
                Usuario admin = new Usuario();
                admin.setNombreCompleto("Doctor Administrador");
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123")); // Contraseña por defecto
                admin.setRol("ROLE_ADMIN");
                admin.setActivo(true);
                
                repository.save(admin);
                System.out.println("✅ USUARIO MAESTRO CREADO: Usuario: admin | Contraseña: admin123");
            }
        };
    }
}