package com.example.IMS_Backend;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ImsBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(ImsBackendApplication.class, args);
    }
}
