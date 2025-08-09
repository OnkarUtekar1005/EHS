package com.ehs.elearning.service;

import com.ehs.elearning.model.Think;
import com.ehs.elearning.model.Think.ThinkType;
import com.ehs.elearning.model.Think.ThinkStatus;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.repository.ThinkRepository;
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
public class ThinkService {
    
    @Autowired
    private ThinkRepository thinkRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public Think createSubmission(Think think) {
        if (think.getStatus() == null) {
            think.setStatus(ThinkStatus.OPEN);
        }
        return thinkRepository.save(think);
    }
    
    public Think createAnonymousSubmission(ThinkType type, String subject, String description) {
        Think think = new Think();
        think.setType(type);
        think.setSubject(subject);
        think.setDescription(description);
        think.setAnonymous(true);
        think.setStatus(ThinkStatus.OPEN);
        return thinkRepository.save(think);
    }
    
    public Think createUserSubmission(ThinkType type, String subject, String description, 
                                     UUID userId, boolean isAnonymous) {
        Think think = new Think();
        think.setType(type);
        think.setSubject(subject);
        think.setDescription(description);
        think.setAnonymous(isAnonymous);
        think.setStatus(ThinkStatus.OPEN);
        
        if (userId != null) {
            Users user = userRepository.findById(userId).orElse(null);
            think.setUser(user);
        }
        
        return thinkRepository.save(think);
    }
    
    public Optional<Think> findById(UUID id) {
        return thinkRepository.findById(id);
    }
    
    public List<Think> getAllSubmissions() {
        return thinkRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public List<Think> getSubmissionsByType(ThinkType type) {
        return thinkRepository.findByTypeOrderByCreatedAtDesc(type);
    }
    
    public List<Think> getSubmissionsByStatus(ThinkStatus status) {
        return thinkRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    public List<Think> getUserSubmissions(UUID userId) {
        Users user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            return thinkRepository.findByUserOrderByCreatedAtDesc(user);
        }
        return List.of();
    }
    
    public Think updateStatus(UUID id, ThinkStatus newStatus) {
        Optional<Think> thinkOpt = thinkRepository.findById(id);
        if (thinkOpt.isPresent()) {
            Think think = thinkOpt.get();
            think.setStatus(newStatus);
            return thinkRepository.save(think);
        }
        return null;
    }
    
    public Think addAdminResponse(UUID id, String response, UUID adminId) {
        Optional<Think> thinkOpt = thinkRepository.findById(id);
        if (thinkOpt.isPresent()) {
            Think think = thinkOpt.get();
            think.setAdminResponse(response);
            think.setRespondedAt(LocalDateTime.now());
            
            if (adminId != null) {
                Users admin = userRepository.findById(adminId).orElse(null);
                think.setRespondedBy(admin);
            }
            
            if (think.getStatus() == ThinkStatus.OPEN) {
                think.setStatus(ThinkStatus.IN_PROGRESS);
            }
            
            return thinkRepository.save(think);
        }
        return null;
    }
    
    public Long getCountByType(ThinkType type) {
        return thinkRepository.countByType(type);
    }
    
    public Long getCountByStatus(ThinkStatus status) {
        return thinkRepository.countByStatus(status);
    }
    
    public void deleteSubmission(UUID id) {
        thinkRepository.deleteById(id);
    }
}