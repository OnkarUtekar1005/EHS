package com.ehs.elearning.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Configuration
public class GoogleDriveConfig {

	@Value("${google.drive.service-account-key-path:}")
	private String serviceAccountKeyPath;

	@Value("${google.drive.application-name:EHS E-Learning Platform}")
	private String applicationName;

	@Bean
	public Drive drive() throws IOException, GeneralSecurityException {
		HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
		JsonFactory jsonFactory = GsonFactory.getDefaultInstance();

		GoogleCredentials credentials;

		// Check if service account key path is provided
		if (serviceAccountKeyPath != null && !serviceAccountKeyPath.isEmpty()) {
			// Try to load from file system first
			Resource resource = new FileSystemResource(serviceAccountKeyPath);
			if (!resource.exists()) {
				// Try to load from classpath
				resource = new ClassPathResource(serviceAccountKeyPath);
			}

			credentials = GoogleCredentials.fromStream(resource.getInputStream())
					.createScoped(Collections.singleton(DriveScopes.DRIVE));
		} else {
			// For development, use default credentials (requires gcloud auth
			// application-default login)
			credentials = GoogleCredentials.getApplicationDefault()
					.createScoped(Collections.singleton(DriveScopes.DRIVE));
		}

		return new Drive.Builder(httpTransport, jsonFactory, new HttpCredentialsAdapter(credentials))
				.setApplicationName(applicationName).build();
	}
}