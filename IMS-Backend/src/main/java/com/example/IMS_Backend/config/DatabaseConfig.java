package com.example.IMS_Backend.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        
        if (databaseUrl != null && databaseUrl.startsWith("postgresql://")) {
            // Convert Render's postgresql:// format to jdbc:postgresql:// format
            String jdbcUrl = databaseUrl.replace("postgresql://", "jdbc:postgresql://");
            
            // Log the URL for debugging (remove in production)
            System.out.println("DATABASE_URL found, converting to JDBC format");
            System.out.println("JDBC URL: " + jdbcUrl);
            
            return DataSourceBuilder.create()
                    .url(jdbcUrl)
                    .build();
        }
        
        // Fallback to default configuration
        System.out.println("DATABASE_URL not found or not in postgresql:// format, using default");
        return DataSourceBuilder.create().build();
    }
}
