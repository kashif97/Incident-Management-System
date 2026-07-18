package com.example.IMS_Backend.config;

import com.example.IMS_Backend.category.Category;
import com.example.IMS_Backend.incident.IncidentPriority;
import com.example.IMS_Backend.rbac.*;
import com.example.IMS_Backend.repository.*;
import com.example.IMS_Backend.sla.Sla;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository               roleRepo;
    private final PermissionRepository         permRepo;
    private final UserRepository               userRepo;
    private final UserRoleAssignmentRepository assignRepo;
    private final CategoryRepository           categoryRepo;
    private final SlaRepository                slaRepo;
    private final PasswordEncoder              encoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedPermissions();
        seedRoles();
        seedAdmin();
        seedCategories();
        seedSlas();
        log.info("✅ IMS Data seeding complete");
    }

    private void seedPermissions() {
        String[][] perms = {
            {"INCIDENT_CREATE",    "INCIDENT","CREATE", "Raise a new incident"},
            {"INCIDENT_VIEW_OWN",  "INCIDENT","READ",   "View own incidents"},
            {"INCIDENT_VIEW_ALL",  "INCIDENT","READ",   "View all incidents"},
            {"INCIDENT_LOG",       "INCIDENT","UPDATE", "Log and validate incident"},
            {"INCIDENT_CATEGORIZE","INCIDENT","UPDATE", "Set category and priority"},
            {"INCIDENT_ASSIGN",    "INCIDENT","ASSIGN", "Assign incident to resolver"},
            {"INCIDENT_WORK",      "INCIDENT","UPDATE", "Work on assigned incident"},
            {"INCIDENT_RESOLVE",   "INCIDENT","RESOLVE","Mark incident as resolved"},
            {"INCIDENT_CLOSE",     "INCIDENT","CLOSE",  "Close resolved incident"},
            {"INCIDENT_REOPEN",    "INCIDENT","UPDATE", "Reopen closed incident"},
            {"INCIDENT_ESCALATE",  "INCIDENT","UPDATE", "Escalate incident"},
            {"COMMENT_ADD",        "INCIDENT","CREATE", "Add comments/work notes"},
            {"USER_MANAGE",        "USER",    "CREATE", "Create and manage users"},
            {"ROLE_MANAGE",        "ROLE",    "CREATE", "Create and manage roles"},
            {"SLA_MANAGE",         "SLA",     "CREATE", "Create and manage SLAs"},
            {"AUDIT_VIEW",         "AUDIT",   "READ",   "View audit logs"},
            {"REPORT_VIEW",        "REPORT",  "READ",   "View reports"},
        };
        for (String[] p : perms) {
            if (permRepo.findByPermissionCode(p[0]).isEmpty()) {
                permRepo.save(Permission.builder()
                        .permissionCode(p[0]).resource(p[1])
                        .action(p[2]).description(p[3]).build());
            }
        }
    }

    private void seedRoles() {
        Object[][] roleDefs = {
            {RoleCode.ADMIN,       "System Administrator",    "ADMIN",       "Full governance, no incident ops"},
            {RoleCode.REPORTER,    "End User / Requester",    "OPERATIONAL", "Raise and track own incidents"},
            {RoleCode.RESOLVER,    "Support Engineer (L2/L3)","OPERATIONAL", "Investigate and resolve incidents"},
            {RoleCode.INC_MANAGER, "Incident Manager",        "OPERATIONAL", "Log, Monitor, escalate and manage SLAs, categorize and assign incidents"},
        };

        Map<RoleCode, Set<String>> rolePerms = new HashMap<>();
        rolePerms.put(RoleCode.ADMIN,       new HashSet<>(Arrays.asList(
                "USER_MANAGE","ROLE_MANAGE","SLA_MANAGE","AUDIT_VIEW","INCIDENT_VIEW_ALL","REPORT_VIEW")));
        rolePerms.put(RoleCode.REPORTER,    new HashSet<>(Arrays.asList(
                "INCIDENT_CREATE","INCIDENT_VIEW_OWN","COMMENT_ADD")));
        rolePerms.put(RoleCode.INC_MANAGER, new HashSet<>(Arrays.asList(
                "INCIDENT_VIEW_ALL","INCIDENT_LOG","INCIDENT_CATEGORIZE","INCIDENT_ASSIGN",
                "INCIDENT_CLOSE","INCIDENT_REOPEN","INCIDENT_ESCALATE","COMMENT_ADD","SLA_MANAGE","REPORT_VIEW")));
        rolePerms.put(RoleCode.RESOLVER,    new HashSet<>(Arrays.asList(
                "INCIDENT_VIEW_ALL","INCIDENT_WORK","INCIDENT_RESOLVE","COMMENT_ADD","REPORT_VIEW")));

        for (Object[] def : roleDefs) {
            RoleCode code = (RoleCode) def[0];
            if (roleRepo.findByRoleCode(code).isEmpty()) {
                Set<Permission> perms = new HashSet<>();
                for (String pc : rolePerms.get(code)) {
                    permRepo.findByPermissionCode(pc).ifPresent(perms::add);
                }
                roleRepo.save(Role.builder()
                        .roleCode(code)
                        .roleName((String) def[1])
                        .roleType((String) def[2])
                        .description((String) def[3])
                        .isActive(true)
                        .permissions(perms)
                        .build());
            }
        }
    }

    private void seedAdmin() {
        if (userRepo.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@ims.local")
                    .passwordHash(encoder.encode("Admin@123"))
                    .fullName("System Admin")
                    .department("IT")
                    .employeeId("EMP001")
                    .status(User.UserStatus.ACTIVE)
                    .build();
            admin = userRepo.save(admin);

            Role adminRole = roleRepo.findByRoleCode(RoleCode.ADMIN).orElseThrow();
            assignRepo.save(UserRoleAssignment.builder()
                    .user(admin).role(adminRole)
                    .effectiveFrom(LocalDateTime.now())
                    .build());
            log.info("✅ Default admin created  →  username: admin  password: Admin@123");
        }
    }

    private void seedCategories() {
        if (categoryRepo.count() == 0) {
            String[] cats = {
                "Hardware", "Software", "Network", "Security",
                "Access & Permissions", "Email & Communication",
                "Database", "Application", "Other"
            };
            for (String name : cats) {
                categoryRepo.save(Category.builder()
                        .categoryName(name).isActive(true).build());
            }
        }
    }

    private void seedSlas() {
        if (slaRepo.count() == 0) {
            Object[][] slas = {
                {"Critical SLA", IncidentPriority.CRITICAL, 15,  240},
                {"High SLA",     IncidentPriority.HIGH,      60,  480},
                {"Medium SLA",   IncidentPriority.MEDIUM,   240, 1440},
                {"Low SLA",      IncidentPriority.LOW,      480, 2880},
            };
            for (Object[] s : slas) {
                slaRepo.save(Sla.builder()
                        .slaName((String) s[0])
                        .priority((IncidentPriority) s[1])
                        .responseTimeMinutes((Integer) s[2])
                        .resolutionTimeMinutes((Integer) s[3])
                        .isActive(true).build());
            }
        }
    }
}
