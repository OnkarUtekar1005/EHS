package com.ehs.elearning.model;

public enum ModuleStatus {
    DRAFT,       // Initial state, not ready for learners
    PUBLISHED,   // Active and available to learners
    REVIEW,      // Under review, not yet published
    ARCHIVED     // No longer active
}