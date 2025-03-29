// src/pages/Assessment/PostAssessmentPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AssessmentsPage.scss';

const PostAssessmentPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  
  // Mock assessment data
  const assessment = {
    title: 'Chemical Handling Safety - Post-Assessment',
    questions: [
      {
        id: 1,
        text: 'Which of the following is the correct approach to chemical storage?',
        options: [
          'Store chemicals alphabetically',
          'Store chemicals based on compatibility',
          'Store all chemicals together',
          'Store chemicals based on container size'
        ],
        correctAnswer: 'Store chemicals based on compatibility'
      },
      {
        id: 2,
        text: 'What information is NOT typically found in Section 4 of a Safety Data Sheet?',
        options: [
          'First aid measures',
          'Chemical composition',
          'Treatment for exposure',
          'Emergency contact information'
        ],
        correctAnswer: 'Chemical composition'
      },
      {
        id: 3,
        text: 'When handling flammable chemicals, what is the recommended type of storage?',
        options: [
          'Open shelving',
          'Approved flammable storage cabinet',
          'Under sink storage',
          'Regular cabinet with good ventilation'
        ],
        correctAnswer: 'Approved flammable storage cabinet'
      },
      {
        id: 4,
        text: 'What is the first step in responding to a chemical spill?',
        options: [
          'Clean up the spill immediately',
          'Evacuate the area',
          'Assess the situation and identify the chemical',
          'Call your supervisor'
        ],
        correctAnswer: 'Assess the situation and identify the chemical'
      }
    ]
  };
  
  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };
  
  const handleNext = () => {
    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const handleSubmit = () => {
    // In a real app, you would submit answers to the backend
    console.log('Submitting answers:', answers);
    navigate(`/assessments`);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const question = assessment.questions[currentQuestion];
  
  return (
    <div className="assessment-page post-assessment">
      <div className="assessment-header">
        <h1>{assessment.title}</h1>
        <div className="assessment-info">
          <span className="question-counter">
            Question {currentQuestion + 1} of {assessment.questions.length}
          </span>
          <span className="timer">Time Remaining: {formatTime(timeLeft)}</span>
        </div>
      </div>
      
      <div className="assessment-content">
        <div className="question-container">
          <h2 className="question-text">{question.text}</h2>
          
          <div className="options-container">
            {question.options.map((option, index) => (
              <div 
                key={index} 
                className={`option ${answers[question.id] === option ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(question.id, option)}
              >
                <div className="option-marker">{String.fromCharCode(65 + index)}</div>
                <div className="option-text">{option}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="assessment-footer">
        <div className="navigation-buttons">
          <button 
            className="btn-outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </button>
          
          {currentQuestion < assessment.questions.length - 1 ? (
            <button 
              className="btn-primary"
              onClick={handleNext}
            >
              Next
            </button>
          ) : (
            <button 
              className="btn-success"
              onClick={handleSubmit}
              disabled={!answers[question.id]}
            >
              Submit Assessment
            </button>
          )}
        </div>
        
        <div className="question-nav">
          {assessment.questions.map((q, index) => (
            <button
              key={q.id}
              className={`question-dot ${index === currentQuestion ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostAssessmentPage;