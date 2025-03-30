package com.ehs.elearning.repository;

import com.ehs.elearning.model.Answer;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.Question;
import com.ehs.elearning.model.Users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, UUID> {
    List<Answer> findByQuestion(Question question);
    List<Answer> findByQuestionAndUser(Question question, Users user);
    
    Optional<Answer> findByQuestionAndUserAndAttemptNumber(Question question, Users user, Integer attemptNumber);
    
    @Query("SELECT a FROM Answer a WHERE a.question.component = ?1 AND a.user = ?2")
    List<Answer> findByComponentAndUser(ModuleComponent component, Users user);
    
    @Query("SELECT AVG(a.score) FROM Answer a WHERE a.question.component = ?1")
    Double getAverageScoreForComponent(ModuleComponent component);
    
    @Query("SELECT COUNT(a) FROM Answer a WHERE a.question.component = ?1 AND a.isCorrect = true")
    Long countCorrectAnswersForComponent(ModuleComponent component);
    
    @Query("SELECT COUNT(a) FROM Answer a WHERE a.question.component = ?1")
    Long countTotalAnswersForComponent(ModuleComponent component);
}