package com.dxyop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.dxyop") 
public class DxyOpApplication {
    public static void main(String[] args) {
        SpringApplication.run(DxyOpApplication.class, args);
    }
}

