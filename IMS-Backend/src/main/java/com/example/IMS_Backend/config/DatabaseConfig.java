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
        String username = System.getenv("DATABASE_USERNAME");
        String password = System.getenv("DATABASE_PASSWORD");
        
        // If separate username/password are provided, use them with the URL
        if (databaseUrl != null && username != null && password != null) {
            // URL might already be in jdbc:postgresql:// format or postgres:// format
            String jdbcUrl = databaseUrl;
            if (databaseUrl.startsWith("postgres://")) {
                jdbcUrl = databaseUrl.replace("postgres://", "jdbc:postgresql://");
            } else if (databaseUrl.startsWith("postgresql://")) {
                jdbcUrl = databaseUrl.replace("postgresql://", "jdbc:postgresql://");
            }
            
            System.out.println("Using separate DATABASE_USERNAME and DATABASE_PASSWORD");
            System.out.println("JDBC URL: " + jdbcUrl);
            
            return DataSourceBuilder.create()
                    .url(jdbcUrl)
                    .username(username)
                    .password(password)
                    .build();
        }
        
        // Fallback: parse credentials from single DATABASE_URL
        if (databaseUrl != null && (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://"))) {
            // Convert Render's postgres:// or postgresql:// format to jdbc:postgresql:// format
            String jdbcUrl = databaseUrl.replaceFirst("postgres(?:ql)?://", "jdbc:postgresql://");
            
            // Check if port is missing and add default port 5432
            if (!jdbcUrl.matches(".*:\\d+/.*")) {
                int lastSlashIndex = jdbcUrl.lastIndexOf('/');
                if (lastSlashIndex > 0) {
                    jdbcUrl = jdbcUrl.substring(0, lastSlashIndex) + ":5432" + jdbcUrl.substring(lastSlashIndex);
                    System.out.println("Added default port 5432 to JDBC URL");
                }
            }
            
            System.out.println("DATABASE_URL found with embedded credentials, converting to JDBC format");
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
