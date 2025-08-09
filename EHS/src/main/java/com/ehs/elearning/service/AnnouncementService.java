package com.ehs.elearning.service;

import com.ehs.elearning.model.Announcement;
import com.ehs.elearning.model.Announcement.Priority;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.repository.AnnouncementRepository;
import com.ehs.elearning.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AnnouncementService {
    
    @Autowired
    private AnnouncementRepository announcementRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public Announcement createAnnouncement(String title, String content, String authorName, 
                                         Priority priority, LocalDateTime expiresAt, UUID createdById) {
        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setAuthorName(authorName);
        announcement.setPriority(priority);
        announcement.setExpiresAt(expiresAt);
        announcement.setActive(true);
        
        if (createdById != null) {
            Users user = userRepository.findById(createdById).orElse(null);
            announcement.setCreatedBy(user);
        }
        
        return announcementRepository.save(announcement);
    }
    
    public Optional<Announcement> findById(UUID id) {
        return announcementRepository.findById(id);
    }
    
    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public List<Announcement> getActiveAnnouncements() {
        return announcementRepository.findActiveNonExpiredAnnouncements(LocalDateTime.now());
    }
    
    public List<Announcement> getActiveAnnouncementsByPriority(Priority priority) {
        return announcementRepository.findActiveNonExpiredAnnouncementsByPriority(priority, LocalDateTime.now());
    }
    
    public List<Announcement> getAnnouncementsByUser(UUID userId) {
        Users user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            return announcementRepository.findByCreatedByOrderByCreatedAtDesc(user);
        }
        return List.of();
    }
    
    public Announcement updateAnnouncement(UUID id, String title, String content, String authorName,
                                         Priority priority, LocalDateTime expiresAt, Boolean isActive) {
        Optional<Announcement> announcementOpt = announcementRepository.findById(id);
        if (announcementOpt.isPresent()) {
            Announcement announcement = announcementOpt.get();
            
            if (title != null) announcement.setTitle(title);
            if (content != null) announcement.setContent(content);
            if (authorName != null) announcement.setAuthorName(authorName);
            if (priority != null) announcement.setPriority(priority);
            if (expiresAt != null) announcement.setExpiresAt(expiresAt);
            if (isActive != null) announcement.setActive(isActive);
            
            return announcementRepository.save(announcement);
        }
        return null;
    }
    
    public Announcement toggleAnnouncementStatus(UUID id) {
        Optional<Announcement> announcementOpt = announcementRepository.findById(id);
        if (announcementOpt.isPresent()) {
            Announcement announcement = announcementOpt.get();
            announcement.setActive(!announcement.isActive());
            return announcementRepository.save(announcement);
        }
        return null;
    }
    
    public void deleteAnnouncement(UUID id) {
        announcementRepository.deleteById(id);
    }
    
    public List<Announcement> searchAnnouncements(String searchTerm) {
        return announcementRepository.searchAnnouncements(searchTerm);
    }
    
    public Long getActiveAnnouncementCount() {
        return announcementRepository.countActiveAnnouncements();
    }
    
    public Long getAnnouncementCountByPriority(Priority priority) {
        return announcementRepository.countByPriorityAndActive(priority);
    }
    
    public List<Announcement> getAnnouncementsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return announcementRepository.findByDateRange(startDate, endDate);
    }
}