package com.ehs.elearning.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.ehs.elearning.model.Answer;
import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.ModuleStatus;
import com.ehs.elearning.model.Question;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.payload.request.AnswerRequest;
import com.ehs.elearning.payload.request.ComponentRequest;
import com.ehs.elearning.payload.request.ModuleRequest;
import com.ehs.elearning.payload.request.QuestionRequest;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.DomainRepository;
import com.ehs.elearning.service.AssessmentService;
import com.ehs.elearning.service.ModuleComponentService;
import com.ehs.elearning.service.TrainingModuleService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/modules")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TrainingModuleController {

    @Autowired
    private TrainingModuleService trainingModuleService;
    
    @Autowired
    private ModuleComponentService moduleComponentService;
    
    @Autowired
    private AssessmentService assessmentService;
    
    @Autowired
    private DomainRepository domainRepository;
    
    // Create a new training module
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createModule(@Valid @RequestBody ModuleRequest moduleRequest) {
        try {
            Domain domain = domainRepository.findById(moduleRequest.getDomainId())
                .orElseThrow(() -> new EntityNotFoundException("Domain not found with id: " + moduleRequest.getDomainId()));
            
            TrainingModule module = new TrainingModule();
            module.setTitle(moduleRequest.getTitle());
            module.setDescription(moduleRequest.getDescription());
            module.setDomain(domain);
            module.setPassingScore(moduleRequest.getPassingScore());
            module.setEstimatedDuration(moduleRequest.getEstimatedDuration());
            module.setIconUrl(moduleRequest.getIconUrl());
            
            TrainingModule createdModule = trainingModuleService.createTrainingModule(module);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdModule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Get all modules with pagination, search and filtering
    @GetMapping
    public ResponseEntity<?> getModules(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID domainId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {
        
        try {
            List<Sort.Order> orders = new ArrayList<>();
            
            for (String sortItem : sort) {
                String[] parts = sortItem.split(",");
                orders.add(new Sort.Order(
                    parts.length > 1 && parts[1].equalsIgnoreCase("desc") ? 
                        Sort.Direction.DESC : Sort.Direction.ASC, 
                    parts[0]));
            }
            
            Pageable pageable = PageRequest.of(page, size, Sort.by(orders));
            
            ModuleStatus moduleStatus = null;
            if (status != null && !status.isEmpty()) {
                try {
                    moduleStatus = ModuleStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(new MessageResponse("Invalid status value"));
                }
            }
            
            Page<TrainingModule> modules = trainingModuleService.getTrainingModules(search, domainId, moduleStatus, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("modules", modules.getContent());
            response.put("currentPage", modules.getNumber());
            response.put("totalItems", modules.getTotalElements());
            response.put("totalPages", modules.getTotalPages());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Get a module by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getModuleById(@PathVariable UUID id) {
        try {
            TrainingModule module = trainingModuleService.getTrainingModuleById(id);
            return ResponseEntity.ok(module);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Update a module
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateModule(@PathVariable UUID id, @Valid @RequestBody ModuleRequest moduleRequest) {
        try {
            TrainingModule module = new TrainingModule();
            
            // Only set fields that are provided
            module.setTitle(moduleRequest.getTitle());
            module.setDescription(moduleRequest.getDescription());
            
            if (moduleRequest.getDomainId() != null) {
                Domain domain = domainRepository.findById(moduleRequest.getDomainId())
                    .orElseThrow(() -> new EntityNotFoundException("Domain not found with id: " + moduleRequest.getDomainId()));
                module.setDomain(domain);
            }
            
            module.setPassingScore(moduleRequest.getPassingScore());
            module.setEstimatedDuration(moduleRequest.getEstimatedDuration());
            module.setIconUrl(moduleRequest.getIconUrl());
            
            TrainingModule updatedModule = trainingModuleService.updateTrainingModule(id, module);
            
            return ResponseEntity.ok(updatedModule);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Delete a module
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteModule(@PathVariable UUID id) {
        try {
            trainingModuleService.deleteTrainingModule(id);
            return ResponseEntity.ok(new MessageResponse("Module deleted successfully"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Publish a module
    @PutMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> publishModule(@PathVariable UUID id) {
        try {
            TrainingModule module = trainingModuleService.publishModule(id);
            return ResponseEntity.ok(module);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Archive a module
    @PutMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> archiveModule(@PathVariable UUID id) {
        try {
            TrainingModule module = trainingModuleService.archiveModule(id);
            return ResponseEntity.ok(module);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Clone a module
    @PostMapping("/{id}/clone")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cloneModule(@PathVariable UUID id) {
        try {
            TrainingModule clonedModule = trainingModuleService.cloneModule(id);
            return ResponseEntity.status(HttpStatus.CREATED).body(clonedModule);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // MODULE COMPONENTS
    
    // Create a component for a module
    @PostMapping("/{moduleId}/components")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createComponent(
            @PathVariable UUID moduleId, 
            @Valid @RequestBody ComponentRequest componentRequest) {
        try {
            ModuleComponent component = new ModuleComponent();
            component.setTitle(componentRequest.getTitle());
            component.setDescription(componentRequest.getDescription());
            component.setType(componentRequest.getType());
            component.setSequenceOrder(componentRequest.getSequenceOrder());
            component.setIsRequired(componentRequest.getIsRequired());
            component.setTimeLimit(componentRequest.getTimeLimit());
            component.setPassingScore(componentRequest.getPassingScore());
            
            ModuleComponent createdComponent = moduleComponentService.createModuleComponent(component, moduleId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdComponent);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Get all components for a module
    @GetMapping("/{moduleId}/components")
    public ResponseEntity<?> getModuleComponents(@PathVariable UUID moduleId) {
        try {
            List<ModuleComponent> components = moduleComponentService.getComponentsByModule(moduleId);
            return ResponseEntity.ok(components);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Get a component by ID
    @GetMapping("/components/{id}")
    public ResponseEntity<?> getComponentById(@PathVariable UUID id) {
        try {
            ModuleComponent component = moduleComponentService.getComponentById(id);
            return ResponseEntity.ok(component);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Update a component
    @PutMapping("/components/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateComponent(
            @PathVariable UUID id, 
            @Valid @RequestBody ComponentRequest componentRequest) {
        try {
            ModuleComponent component = new ModuleComponent();
            component.setTitle(componentRequest.getTitle());
            component.setDescription(componentRequest.getDescription());
            component.setType(componentRequest.getType());
            component.setIsRequired(componentRequest.getIsRequired());
            component.setTimeLimit(componentRequest.getTimeLimit());
            component.setPassingScore(componentRequest.getPassingScore());
            
            ModuleComponent updatedComponent = moduleComponentService.updateComponent(id, component);
            
            return ResponseEntity.ok(updatedComponent);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Delete a component
    @DeleteMapping("/components/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteComponent(@PathVariable UUID id) {
        try {
            moduleComponentService.deleteComponent(id);
            return ResponseEntity.ok(new MessageResponse("Component deleted successfully"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Update component order
    @PutMapping("/{moduleId}/components/order")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateComponentOrder(
            @PathVariable UUID moduleId,
            @RequestBody List<UUID> componentIds) {
        try {
            moduleComponentService.updateComponentOrder(moduleId, componentIds);
            return ResponseEntity.ok(new MessageResponse("Component order updated successfully"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // ASSESSMENTS
    
    // Create a question for a component
    @PostMapping("/components/{componentId}/questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createQuestion(
            @PathVariable UUID componentId,
            @Valid @RequestBody QuestionRequest questionRequest) {
        try {
            Question question = new Question();
            question.setText(questionRequest.getText());
            question.setType(questionRequest.getType());
            question.setSequenceOrder(questionRequest.getSequenceOrder());
            question.setPoints(questionRequest.getPoints());
            
            // Create answers if provided
            if (questionRequest.getAnswers() != null) {
                List<Answer> answers = new ArrayList<>();
                for (AnswerRequest answerRequest : questionRequest.getAnswers()) {
                    Answer answer = new Answer();
                    answer.setText(answerRequest.getText());
                    answer.setIsCorrect(answerRequest.getIsCorrect());
                    answers.add(answer);
                }
                question.setAnswers(answers);
            }
            
            Question createdQuestion = assessmentService.createQuestion(question, componentId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdQuestion);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Get all questions for a component
    @GetMapping("/components/{componentId}/questions")
    public ResponseEntity<?> getComponentQuestions(@PathVariable UUID componentId) {
        try {
            List<Question> questions = assessmentService.getQuestionsByComponent(componentId);
            return ResponseEntity.ok(questions);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Get a question by ID
    @GetMapping("/questions/{id}")
    public ResponseEntity<?> getQuestionById(@PathVariable UUID id) {
        try {
            Question question = assessmentService.getQuestionById(id);
            return ResponseEntity.ok(question);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Update a question
    @PutMapping("/questions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody QuestionRequest questionRequest) {
        try {
            Question question = new Question();
            question.setText(questionRequest.getText());
            question.setType(questionRequest.getType());
            question.setPoints(questionRequest.getPoints());
            
            Question updatedQuestion = assessmentService.updateQuestion(id, question);
            
            return ResponseEntity.ok(updatedQuestion);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Delete a question
    @DeleteMapping("/questions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteQuestion(@PathVariable UUID id) {
        try {
            assessmentService.deleteQuestion(id);
            return ResponseEntity.ok(new MessageResponse("Question deleted successfully"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Create an answer for a question
    @PostMapping("/questions/{questionId}/answers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAnswer(
            @PathVariable UUID questionId,
            @Valid @RequestBody AnswerRequest answerRequest) {
        try {
            Answer answer = new Answer();
            answer.setText(answerRequest.getText());
            answer.setIsCorrect(answerRequest.getIsCorrect());
            
            Answer createdAnswer = assessmentService.createAnswer(answer, questionId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAnswer);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Update an answer
    @PutMapping("/answers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAnswer(
            @PathVariable UUID id,
            @Valid @RequestBody AnswerRequest answerRequest) {
        try {
            Answer answer = new Answer();
            answer.setText(answerRequest.getText());
            answer.setIsCorrect(answerRequest.getIsCorrect());
            
            Answer updatedAnswer = assessmentService.updateAnswer(id, answer);
            
            return ResponseEntity.ok(updatedAnswer);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Delete an answer
    @DeleteMapping("/answers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAnswer(@PathVariable UUID id) {
        try {
            assessmentService.deleteAnswer(id);
            return ResponseEntity.ok(new MessageResponse("Answer deleted successfully"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Update question order
    @PutMapping("/components/{componentId}/questions/order")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateQuestionOrder(
            @PathVariable UUID componentId,
            @RequestBody List<UUID> questionIds) {
        try {
            assessmentService.updateQuestionOrder(componentId, questionIds);
            return ResponseEntity.ok(new MessageResponse("Question order updated successfully"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}