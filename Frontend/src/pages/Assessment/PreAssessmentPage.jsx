// src/pages/Assessment/PreAssessmentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AssessmentsPage.scss';

// Import common components
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

const PreAssessmentPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState(null);
  const [moduleInfo, setModuleInfo] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [assessmentStarted, setAssessmentStarted] = useState(false);

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessment = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch module info
        const moduleResponse = await axios.get(`/api/modules/${moduleId}`);
        setModuleInfo(moduleResponse.data);
        
        // Fetch pre-assessment
        const assessmentId = moduleResponse.data.preAssessmentId;
        const assessmentResponse = await axios.get(`/api/assessments/${assessmentId}`);
        setAssessment(assessmentResponse.data);
        
        // Initialize empty answers for all questions
        const initialAnswers = {};
        assessmentResponse.data.questions.forEach(question => {
          initialAnswers[question.id] = '';
        });
        setAnswers(initialAnswers);
        
        // Set timer based on assessment time limit (in minutes)
        if (assessmentResponse.data.timeLimit) {
          setTimeLeft(assessmentResponse.data.timeLimit * 60);
        }
        
      } catch (err) {
        console.error('Error fetching assessment data:', err);
        setError('Failed to load assessment data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssessment();
  }, [moduleId]);

  // Timer countdown
  useEffect(() => {
    if (!assessmentStarted || timeLeft === null) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [assessmentStarted, timeLeft]);

  // Start assessment
  const startAssessment = () => {
    setAssessmentStarted(true);
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Handle navigating to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Handle navigating to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Submit assessment
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const submissionData = {
        assessmentId: assessment.id,
        moduleId: moduleId,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer
        })),
        timeSpent: assessment.timeLimit * 60 - timeLeft
      };
      
      await axios.post(`/api/assessments/${assessment.id}/submit`, submissionData);
      
      // Navigate to learning material page
      navigate(`/assessments/${moduleId}/learning`);
      
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to submit assessment. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Format time left
  const formatTimeLeft = () => {
    if (timeLeft === null) return '';
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!assessmentStarted) {
    return (
      <div className="assessment-page">
        <div className="assessment-intro">
          <h1>Pre-Assessment: {moduleInfo?.title}</h1>
          <p className="intro-description">
            This pre-assessment will help us understand your current knowledge level.
            Your performance will not affect your certification.
          </p>
          
          <div className="assessment-details">
            <div className="detail-item">
              <span className="detail-label">Questions:</span>
              <span className="detail-value">{assessment?.questions.length}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time Limit:</span>
              <span className="detail-value">{assessment?.timeLimit} minutes</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Passing Score:</span>
              <span className="detail-value">{assessment?.passingScore}%</span>
            </div>
          </div>
          
          <div className="intro-instructions">
            <h3>Instructions:</h3>
            <ul>
              <li>Read each question carefully before answering.</li>
              <li>You can navigate between questions using the previous and next buttons.</li>
              <li>The assessment will automatically submit when the time expires.</li>
              <li>Do not refresh the page or leave during the assessment.</li>
            </ul>
          </div>
          
          <button 
            className="start-button"
            onClick={startAssessment}
          >
            Start Pre-Assessment
          </button>
        </div>
      </div>
    );
  }

  // Current question
  const currentQuestion = assessment?.questions[currentQuestionIndex];

  return (
    <div className="assessment-page">
      {error && <div className="error-message">{error}</div>}
      
      <div className="assessment-header">
        <h1>Pre-Assessment: {moduleInfo?.title}</h1>
        
        <div className="assessment-progress">
          <div className="progress-text">
            Question {currentQuestionIndex + 1} of {assessment?.questions.length}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestionIndex + 1) / assessment?.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {timeLeft !== null && (
          <div className={`timer ${timeLeft < 60 ? 'timer-warning' : ''}`}>
            Time Left: {formatTimeLeft()}
          </div>
        )}
      </div>
      
      <div className="question-container">
        <div className="question-number">Question {currentQuestionIndex + 1}</div>
        <div className="question-text">{currentQuestion?.text}</div>
        
        <div className="answer-options">
          {currentQuestion?.type === 'MULTIPLE_CHOICE' && currentQuestion?.options.map((option, index) => (
            <div 
              key={index} 
              className={`answer-option ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(currentQuestion.id, option)}
            >
              <div className="option-indicator">
                {answers[currentQuestion.id] === option ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </div>
              <div className="option-text">{option}</div>
            </div>
          ))}
          
          {currentQuestion?.type === 'TRUE_FALSE' && (
            <>
              <div 
                className={`answer-option ${answers[currentQuestion.id] === 'true' ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(currentQuestion.id, 'true')}
              >
                <div className="option-indicator">
                  {answers[currentQuestion.id] === 'true' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </div>
                <div className="option-text">True</div>
              </div>
              
              <div 
                className={`answer-option ${answers[currentQuestion.id] === 'false' ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(currentQuestion.id, 'false')}
              >
                <div className="option-indicator">
                  {answers[currentQuestion.id] === 'false' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </div>
                <div className="option-text">False</div>
              </div>
            </>
          )}
          
          {currentQuestion?.type === 'SHORT_ANSWER' && (
            <div className="short-answer-container">
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                rows={5}
              ></textarea>
            </div>
          )}
        </div>
      </div>
      
      <div className="assessment-navigation">
        <button 
          className="nav-button previous"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Previous
        </button>
        
        {currentQuestionIndex < assessment.questions.length - 1 ? (
          <button 
            className="nav-button next"
            onClick={handleNextQuestion}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        ) : (
          <button 
            className="nav-button submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PreAssessmentPage;