package com.example.IMS_Backend.auth;

import com.example.IMS_Backend.rbac.RoleCode;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private Key key() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(Long userId, String username, RoleCode roleCode) {
        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .claim("role", roleCode.name())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody();
    }

    public String extractUsername(String token) { return extractClaims(token).getSubject(); }
    public Long   extractUserId(String token)   { return extractClaims(token).get("userId", Long.class); }
    public String extractRole(String token)     { return extractClaims(token).get("role", String.class); }

    public boolean isValid(String token) {
        try { extractClaims(token); return true; }
        catch (JwtException | IllegalArgumentException e) { return false; }
    }
}
