package com.ehs.elearning.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ehs.elearning.model.Answer;
import com.ehs.elearning.model.Question;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, UUID> {

    // Find answers by question
    List<Answer> findByQuestion(Question question);
    
    // Find correct answers for a question
    List<Answer> findByQuestionAndIsCorrect(Question question, Boolean isCorrect);
    
    // Count answers by question
    long countByQuestion(Question question);
    
    // Count correct answers by question
    long countByQuestionAndIsCorrect(Question question, Boolean isCorrect);
}