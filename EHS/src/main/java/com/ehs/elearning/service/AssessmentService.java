package com.ehs.elearning.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ehs.elearning.model.Answer;
import com.ehs.elearning.model.ComponentType;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.ModuleStatus;
import com.ehs.elearning.model.Question;
import com.ehs.elearning.model.QuestionType;
import com.ehs.elearning.repository.AnswerRepository;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.repository.QuestionRepository;

import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.UUID;

@Service
public class AssessmentService {

    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private AnswerRepository answerRepository;
    
    @Autowired
    private ModuleComponentRepository moduleComponentRepository;

    // Create a new question with answers
    @Transactional
    public Question createQuestion(Question question, UUID componentId) {
        ModuleComponent component = moduleComponentRepository.findById(componentId)
            .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + componentId));
        
        // Can't modify published modules
        if (component.getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        // Validate component is an assessment type
        if (component.getType() != ComponentType.PRE_ASSESSMENT && component.getType() != ComponentType.POST_ASSESSMENT) {
            throw new IllegalArgumentException("Questions can only be added to assessment components");
        }
        
        question.setModuleComponent(component);
        
        // Set sequence order if not provided
        if (question.getSequenceOrder() == null) {
            Integer maxSequence = questionRepository.findMaxSequenceOrderByComponent(component);
            question.setSequenceOrder(maxSequence != null ? maxSequence + 1 : 1);
        }
        
        // Validate question type and answers
        validateQuestion(question);
        
        // Save the question first
        Question savedQuestion = questionRepository.save(question);
        
        // Save answers
        if (question.getAnswers() != null) {
            for (Answer answer : question.getAnswers()) {
                answer.setQuestion(savedQuestion);
                answerRepository.save(answer);
            }
        }
        
        return savedQuestion;
    }

    // Get all questions for a component
    public List<Question> getQuestionsByComponent(UUID componentId) {
        ModuleComponent component = moduleComponentRepository.findById(componentId)
            .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + componentId));
        
        return questionRepository.findByModuleComponentOrderBySequenceOrderAsc(component);
    }

    // Get a question by ID
    public Question getQuestionById(UUID id) {
        return questionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Question not found with id: " + id));
    }

    // Update a question
    @Transactional
    public Question updateQuestion(UUID id, Question updatedQuestion) {
        Question existingQuestion = questionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Question not found with id: " + id));
        
        // Can't modify published modules
        if (existingQuestion.getModuleComponent().getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        // Update fields
        if (updatedQuestion.getText() != null) {
            existingQuestion.setText(updatedQuestion.getText());
        }
        if (updatedQuestion.getPoints() != null) {
            existingQuestion.setPoints(updatedQuestion.getPoints());
        }
        
        // Cannot change question type after creation
        if (updatedQuestion.getType() != null && updatedQuestion.getType() != existingQuestion.getType()) {
            throw new IllegalArgumentException("Cannot change question type after creation");
        }
        
        return questionRepository.save(existingQuestion);
    }

    // Delete a question
    @Transactional
    public void deleteQuestion(UUID id) {
        Question question = questionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Question not found with id: " + id));
        
        // Can't modify published modules
        if (question.getModuleComponent().getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        // Delete answers first
        answerRepository.deleteAll(answerRepository.findByQuestion(question));
        
        // Delete the question
        questionRepository.deleteById(id);
        
        // Reorder remaining questions
        reorderQuestions(question.getModuleComponent().getId());
    }
    
    // Create an answer for a question
    @Transactional
    public Answer createAnswer(Answer answer, UUID questionId) {
        Question question = questionRepository.findById(questionId)
            .orElseThrow(() -> new EntityNotFoundException("Question not found with id: " + questionId));
        
        // Can't modify published modules
        if (question.getModuleComponent().getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        answer.setQuestion(question);
        
        // Validate answer based on question type
        validateAnswer(answer, question);
        
        Answer savedAnswer = answerRepository.save(answer);
        
        return savedAnswer;
    }
    
    // Update an answer
    @Transactional
    public Answer updateAnswer(UUID id, Answer updatedAnswer) {
        Answer existingAnswer = answerRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Answer not found with id: " + id));
        
        // Can't modify published modules
        if (existingAnswer.getQuestion().getModuleComponent().getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        // Update fields
        if (updatedAnswer.getText() != null) {
            existingAnswer.setText(updatedAnswer.getText());
        }
        if (updatedAnswer.getIsCorrect() != null) {
            existingAnswer.setIsCorrect(updatedAnswer.getIsCorrect());
            
            // Validate correct answers for TRUE_FALSE questions
            if (existingAnswer.getIsCorrect() && 
                existingAnswer.getQuestion().getType() == QuestionType.TRUE_FALSE) {
                
                // Only one answer can be correct for TRUE_FALSE questions
                List<Answer> otherAnswers = answerRepository.findByQuestionAndIsCorrect(
                    existingAnswer.getQuestion(), true);
                
                for (Answer other : otherAnswers) {
                    if (!other.getId().equals(existingAnswer.getId())) {
                        other.setIsCorrect(false);
                        answerRepository.save(other);
                    }
                }
            }
        }
        
        return answerRepository.save(existingAnswer);
    }
    
    // Delete an answer
    @Transactional
    public void deleteAnswer(UUID id) {
        Answer answer = answerRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Answer not found with id: " + id));
        
        // Can't modify published modules
        if (answer.getQuestion().getModuleComponent().getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        answerRepository.deleteById(id);
    }
    
    // Update question order
    @Transactional
    public void updateQuestionOrder(UUID componentId, List<UUID> questionIds) {
        ModuleComponent component = moduleComponentRepository.findById(componentId)
            .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + componentId));
        
        // Can't modify published modules
        if (component.getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        // Validate all question IDs belong to this component
        for (int i = 0; i < questionIds.size(); i++) {
            UUID questionId = questionIds.get(i);
            Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question not found with id: " + questionId));
            
            if (!question.getModuleComponent().getId().equals(componentId)) {
                throw new IllegalArgumentException("Question with id " + questionId + 
                                                 " does not belong to component with id " + componentId);
            }
            
            // Update sequence order
            question.setSequenceOrder(i + 1);
            questionRepository.save(question);
        }
    }
    
    // Helper method to reorder questions after deletion
    private void reorderQuestions(UUID componentId) {
        ModuleComponent component = moduleComponentRepository.findById(componentId)
            .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + componentId));
        
        List<Question> questions = questionRepository.findByModuleComponentOrderBySequenceOrderAsc(component);
        
        for (int i = 0; i < questions.size(); i++) {
            Question question = questions.get(i);
            question.setSequenceOrder(i + 1);
            questionRepository.save(question);
        }
    }
    
    // Helper method to validate question
    private void validateQuestion(Question question) {
        if (question.getType() == null) {
            throw new IllegalArgumentException("Question type is required");
        }
        
        if (question.getType() == QuestionType.TRUE_FALSE) {
            // Ensure TRUE_FALSE questions have exactly 2 answers (True and False)
            if (question.getAnswers() == null || question.getAnswers().size() != 2) {
                throw new IllegalArgumentException("TRUE_FALSE questions must have exactly 2 answers");
            }
            
            // Count correct answers (must be exactly 1 for TRUE_FALSE)
            boolean foundCorrect = false;
            for (Answer answer : question.getAnswers()) {
                if (answer.getIsCorrect() != null && answer.getIsCorrect()) {
                    if (foundCorrect) {
                        throw new IllegalArgumentException("TRUE_FALSE questions can only have one correct answer");
                    }
                    foundCorrect = true;
                }
            }
            
            if (!foundCorrect) {
                throw new IllegalArgumentException("TRUE_FALSE questions must have one correct answer");
            }
        } else if (question.getType() == QuestionType.MULTIPLE_CHOICE) {
            // Ensure MULTIPLE_CHOICE questions have at least 2 answers
            if (question.getAnswers() == null || question.getAnswers().size() < 2) {
                throw new IllegalArgumentException("MULTIPLE_CHOICE questions must have at least 2 answers");
            }
            
            // Ensure at least one answer is correct
            boolean foundCorrect = false;
            for (Answer answer : question.getAnswers()) {
                if (answer.getIsCorrect() != null && answer.getIsCorrect()) {
                    foundCorrect = true;
                    break;
                }
            }
            
            if (!foundCorrect) {
                throw new IllegalArgumentException("MULTIPLE_CHOICE questions must have at least one correct answer");
            }
        }
    }
    
    // Helper method to validate answer
    private void validateAnswer(Answer answer, Question question) {
        if (question.getType() == QuestionType.TRUE_FALSE) {
            // For TRUE_FALSE, only one answer can be correct
            if (answer.getIsCorrect() != null && answer.getIsCorrect()) {
                List<Answer> existingAnswers = answerRepository.findByQuestionAndIsCorrect(question, true);
                if (!existingAnswers.isEmpty()) {
                    throw new IllegalArgumentException("TRUE_FALSE questions can only have one correct answer");
                }
            }
            
            // Limit to 2 answers for TRUE_FALSE
            long answerCount = answerRepository.countByQuestion(question);
            if (answerCount >= 2) {
                throw new IllegalArgumentException("TRUE_FALSE questions can only have 2 answers");
            }
        }
    }
}