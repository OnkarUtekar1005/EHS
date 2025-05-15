package com.ehs.elearning.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.Question;
import com.ehs.elearning.model.QuestionType;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

    // Find questions by module component
    List<Question> findByModuleComponent(ModuleComponent moduleComponent);
    
    // Find questions by module component ordered by sequence
    List<Question> findByModuleComponentOrderBySequenceOrderAsc(ModuleComponent moduleComponent);
    
    // Find questions by type
    List<Question> findByType(QuestionType type);
    
    // Find questions by module component and type
    List<Question> findByModuleComponentAndType(ModuleComponent moduleComponent, QuestionType type);
    
    // Count questions by module component
    long countByModuleComponent(ModuleComponent moduleComponent);
    
    // Find highest sequence order in a component
    @Query("SELECT MAX(q.sequenceOrder) FROM Question q WHERE q.moduleComponent = :component")
    Integer findMaxSequenceOrderByComponent(@Param("component") ModuleComponent component);
    
    // Find total points available in a component
    @Query("SELECT SUM(q.points) FROM Question q WHERE q.moduleComponent = :component")
    Integer findTotalPointsByComponent(@Param("component") ModuleComponent component);
}