package com.ehs.elearning.payload.request;

import com.ehs.elearning.model.CourseComponent.ComponentType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class AssessmentComponentRequest {
    
    @NotNull
    private ComponentType type;
    
    private Boolean required = true;
    
    @NotBlank
    private String title;
    
    @Min(0)
    @Max(100)
    private Integer passingScore = 70;
    
    @Min(0)
    private Integer timeLimit = 30; // minutes
    
    private Boolean shuffleQuestions = false;
    
    private Boolean showResults = true;
    
    private Boolean allowRetake = true;
    
    @Min(1)
    private Integer maxAttempts = 3;
    
    @NotEmpty
    private List<QuestionRequest> questions;
    
    // Inner class for questions
    public static class QuestionRequest {
        private String id;
        
        @NotBlank
        private String question;
        
        @NotNull
        private QuestionType type;
        
        @Min(1)
        private Integer points = 10;
        
        private Boolean required = true;
        
        private List<OptionRequest> options; // For MCQ
        
        private Boolean correctAnswer; // For TRUE_FALSE
        
        private String explanation;
        
        // Inner class for MCQ options
        public static class OptionRequest {
            private String id;
            
            @NotBlank
            private String text;
            
            private Boolean isCorrect = false;
            
            // Getters and setters
            public String getId() {
                return id;
            }
            
            public void setId(String id) {
                this.id = id;
            }
            
            public String getText() {
                return text;
            }
            
            public void setText(String text) {
                this.text = text;
            }
            
            public Boolean getIsCorrect() {
                return isCorrect;
            }
            
            public void setIsCorrect(Boolean isCorrect) {
                this.isCorrect = isCorrect;
            }
        }
        
        public enum QuestionType {
            MCQ,
            TRUE_FALSE
        }
        
        // Getters and setters
        public String getId() {
            return id;
        }
        
        public void setId(String id) {
            this.id = id;
        }
        
        public String getQuestion() {
            return question;
        }
        
        public void setQuestion(String question) {
            this.question = question;
        }
        
        public QuestionType getType() {
            return type;
        }
        
        public void setType(QuestionType type) {
            this.type = type;
        }
        
        public Integer getPoints() {
            return points;
        }
        
        public void setPoints(Integer points) {
            this.points = points;
        }
        
        public Boolean getRequired() {
            return required;
        }
        
        public void setRequired(Boolean required) {
            this.required = required;
        }
        
        public List<OptionRequest> getOptions() {
            return options;
        }
        
        public void setOptions(List<OptionRequest> options) {
            this.options = options;
        }
        
        public Boolean getCorrectAnswer() {
            return correctAnswer;
        }
        
        public void setCorrectAnswer(Boolean correctAnswer) {
            this.correctAnswer = correctAnswer;
        }
        
        public String getExplanation() {
            return explanation;
        }
        
        public void setExplanation(String explanation) {
            this.explanation = explanation;
        }
    }
    
    // Getters and setters
    public ComponentType getType() {
        return type;
    }
    
    public void setType(ComponentType type) {
        this.type = type;
    }
    
    public Boolean getRequired() {
        return required;
    }
    
    public void setRequired(Boolean required) {
        this.required = required;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public Integer getPassingScore() {
        return passingScore;
    }
    
    public void setPassingScore(Integer passingScore) {
        this.passingScore = passingScore;
    }
    
    public Integer getTimeLimit() {
        return timeLimit;
    }
    
    public void setTimeLimit(Integer timeLimit) {
        this.timeLimit = timeLimit;
    }
    
    public Boolean getShuffleQuestions() {
        return shuffleQuestions;
    }
    
    public void setShuffleQuestions(Boolean shuffleQuestions) {
        this.shuffleQuestions = shuffleQuestions;
    }
    
    public Boolean getShowResults() {
        return showResults;
    }
    
    public void setShowResults(Boolean showResults) {
        this.showResults = showResults;
    }
    
    public Boolean getAllowRetake() {
        return allowRetake;
    }
    
    public void setAllowRetake(Boolean allowRetake) {
        this.allowRetake = allowRetake;
    }
    
    public Integer getMaxAttempts() {
        return maxAttempts;
    }
    
    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }
    
    public List<QuestionRequest> getQuestions() {
        return questions;
    }
    
    public void setQuestions(List<QuestionRequest> questions) {
        this.questions = questions;
    }
}