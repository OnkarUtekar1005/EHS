package com.ehs.elearning.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username}")
    private String username;

    @Value("${spring.mail.password}")
    private String password;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private String auth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private String starttls;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Bean
    public JavaMailSender getJavaMailSender() {
        // Always create the mail sender regardless of email enabled flag
        // to avoid null reference issues
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        // Set mail server properties
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        System.out.println("Mail Configuration:");
        System.out.println("Host: " + host);
        System.out.println("Port: " + port);
        System.out.println("Username: " + username);
        System.out.println("Password length: " + (password != null ? password.length() : 0));
        System.out.println("Email Enabled: " + emailEnabled);

        // Configure Java Mail properties
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", auth);
        props.put("mail.smtp.starttls.enable", starttls);
        props.put("mail.debug", "true");

        // Gmail specific settings
        props.put("mail.smtp.ssl.trust", "smtp.gmail.com");
        props.put("mail.smtp.timeout", "30000");
        props.put("mail.smtp.connectiontimeout", "30000");
        props.put("mail.smtp.writetimeout", "30000");

        System.out.println("JavaMailSender configured with host: " + host);
        return mailSender;
    }
}