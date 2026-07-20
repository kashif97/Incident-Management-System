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
            
            // Check if port is missing and add default port 5432
            // Pattern: jdbc:postgresql://user:pass@host/database (missing port)
            // Should be: jdbc:postgresql://user:pass@host:5432/database
            if (!jdbcUrl.matches(".*:\\d+/.*")) {
                // Insert :5432 before the database name
                int lastSlashIndex = jdbcUrl.lastIndexOf('/');
                if (lastSlashIndex > 0) {
                    jdbcUrl = jdbcUrl.substring(0, lastSlashIndex) + ":5432" + jdbcUrl.substring(lastSlashIndex);
                    System.out.println("Added default port 5432 to JDBC URL");
                }
            }
            
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
