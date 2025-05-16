package com.ehs.elearning.service;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.CourseComponent;
import com.ehs.elearning.model.CourseComponent.ComponentType;
import com.ehs.elearning.payload.request.AssessmentComponentRequest;
import com.ehs.elearning.repository.CourseComponentRepository;
import com.ehs.elearning.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class AssessmentService {
    
    @Autowired
    private CourseComponentRepository componentRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    public CourseComponent createAssessmentComponent(UUID courseId, AssessmentComponentRequest request) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Only allow adding components to DRAFT courses
        if (course.getStatus() != Course.CourseStatus.DRAFT) {
            throw new RuntimeException("Cannot add components to published course");
        }
        
        // Create new component
        CourseComponent component = new CourseComponent();
        component.setType(request.getType());
        component.setRequired(request.getRequired());
        
        // Build the data structure for the assessment
        Map<String, Object> assessmentData = new HashMap<>();
        assessmentData.put("title", request.getTitle());
        assessmentData.put("passingScore", request.getPassingScore());
        assessmentData.put("timeLimit", request.getTimeLimit());
        assessmentData.put("shuffleQuestions", request.getShuffleQuestions());
        assessmentData.put("showResults", request.getShowResults());
        assessmentData.put("allowRetake", request.getAllowRetake());
        assessmentData.put("maxAttempts", request.getMaxAttempts());
        
        // Convert questions to Map structure
        List<Map<String, Object>> questionsList = new ArrayList<>();
        for (AssessmentComponentRequest.QuestionRequest question : request.getQuestions()) {
            Map<String, Object> questionData = new HashMap<>();
            questionData.put("id", question.getId() != null ? question.getId() : UUID.randomUUID().toString());
            questionData.put("question", question.getQuestion());
            questionData.put("type", question.getType().toString());
            questionData.put("points", question.getPoints());
            questionData.put("required", question.getRequired());
            questionData.put("explanation", question.getExplanation());
            
            if (question.getType() == AssessmentComponentRequest.QuestionRequest.QuestionType.MCQ) {
                // For MCQ, store options
                List<Map<String, Object>> optionsList = new ArrayList<>();
                for (AssessmentComponentRequest.QuestionRequest.OptionRequest option : question.getOptions()) {
                    Map<String, Object> optionData = new HashMap<>();
                    optionData.put("id", option.getId() != null ? option.getId() : UUID.randomUUID().toString());
                    optionData.put("text", option.getText());
                    optionData.put("isCorrect", option.getIsCorrect());
                    optionsList.add(optionData);
                }
                questionData.put("options", optionsList);
                
                // Find correct answer
                String correctAnswer = question.getOptions().stream()
                    .filter(opt -> opt.getIsCorrect())
                    .map(opt -> opt.getText())
                    .findFirst()
                    .orElse("");
                questionData.put("correctAnswer", correctAnswer);
            } else {
                // For TRUE_FALSE
                questionData.put("correctAnswer", question.getCorrectAnswer());
            }
            
            questionsList.add(questionData);
        }
        
        assessmentData.put("questions", questionsList);
        component.setData(assessmentData);
        
        // Set order index
        int maxOrder = course.getComponents().stream()
            .mapToInt(CourseComponent::getOrderIndex)
            .max()
            .orElse(0);
        component.setOrderIndex(maxOrder + 1);
        
        // Add to course and save
        course.addComponent(component);
        return componentRepository.save(component);
    }
    
    public CourseComponent updateAssessmentComponent(UUID courseId, UUID componentId, AssessmentComponentRequest request) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Only allow updating components in DRAFT courses
        if (course.getStatus() != Course.CourseStatus.DRAFT) {
            throw new RuntimeException("Cannot update components in published course");
        }
        
        CourseComponent component = componentRepository.findById(componentId)
            .orElseThrow(() -> new RuntimeException("Component not found"));
        
        // Verify component belongs to the course
        if (!component.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Component does not belong to this course");
        }
        
        // Update the component
        component.setRequired(request.getRequired());
        
        // Update data (same structure as create)
        Map<String, Object> assessmentData = new HashMap<>();
        assessmentData.put("title", request.getTitle());
        assessmentData.put("passingScore", request.getPassingScore());
        assessmentData.put("timeLimit", request.getTimeLimit());
        assessmentData.put("shuffleQuestions", request.getShuffleQuestions());
        assessmentData.put("showResults", request.getShowResults());
        assessmentData.put("allowRetake", request.getAllowRetake());
        assessmentData.put("maxAttempts", request.getMaxAttempts());
        
        // Convert questions to Map structure
        List<Map<String, Object>> questionsList = new ArrayList<>();
        for (AssessmentComponentRequest.QuestionRequest question : request.getQuestions()) {
            Map<String, Object> questionData = new HashMap<>();
            questionData.put("id", question.getId() != null ? question.getId() : UUID.randomUUID().toString());
            questionData.put("question", question.getQuestion());
            questionData.put("type", question.getType().toString());
            questionData.put("points", question.getPoints());
            questionData.put("required", question.getRequired());
            questionData.put("explanation", question.getExplanation());
            
            if (question.getType() == AssessmentComponentRequest.QuestionRequest.QuestionType.MCQ) {
                // For MCQ, store options
                List<Map<String, Object>> optionsList = new ArrayList<>();
                for (AssessmentComponentRequest.QuestionRequest.OptionRequest option : question.getOptions()) {
                    Map<String, Object> optionData = new HashMap<>();
                    optionData.put("id", option.getId() != null ? option.getId() : UUID.randomUUID().toString());
                    optionData.put("text", option.getText());
                    optionData.put("isCorrect", option.getIsCorrect());
                    optionsList.add(optionData);
                }
                questionData.put("options", optionsList);
                
                // Find correct answer
                String correctAnswer = question.getOptions().stream()
                    .filter(opt -> opt.getIsCorrect())
                    .map(opt -> opt.getText())
                    .findFirst()
                    .orElse("");
                questionData.put("correctAnswer", correctAnswer);
            } else {
                // For TRUE_FALSE
                questionData.put("correctAnswer", question.getCorrectAnswer());
            }
            
            questionsList.add(questionData);
        }
        
        assessmentData.put("questions", questionsList);
        component.setData(assessmentData);
        
        return componentRepository.save(component);
    }
}