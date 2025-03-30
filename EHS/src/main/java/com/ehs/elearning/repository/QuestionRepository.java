package com.ehs.elearning.repository;

import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.Question;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    List<Question> findByComponentOrderBySequenceOrderAsc(ModuleComponent component);
    Question findByComponentAndSequenceOrder(ModuleComponent component, Integer sequenceOrder);
    Long countByComponent(ModuleComponent component);
}