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
            return DataSourceBuilder.create()
                    .url(jdbcUrl)
                    .build();
        }
        
        // Fallback to default configuration
        return DataSourceBuilder.create().build();
    }
}
