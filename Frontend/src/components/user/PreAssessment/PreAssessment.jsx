import React, { useState } from 'react';
import Button from '../../common/Button';
//import './PreAssessment.scss';

const PreAssessment = ({ questions, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(questions.length * 60); // 1 minute per question
  const [completed, setCompleted] = useState(false);
  
  // Timer effect
  React.useEffect(() => {
    if (timeLeft <= 0 || completed) {
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, completed]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleAnswerSelect = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };
  
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const handleSubmit = () => {
    setCompleted(true);
    
    // Calculate results
    const results = calculateResults();
    
    // Notify parent component
    onComplete(results);
  };
  
  const calculateResults = () => {
    let correctCount = 0;
    let incorrectCount = 0;
    
    const questionResults = questions.map((question, index) => {
      const userAnswerIndex = answers[index];
      
      if (userAnswerIndex === null) {
        incorrectCount++;
        return {
          question: question.text,
          correct: false,
          userAnswer: null,
          correctAnswer: question.options.find(opt => opt.isCorrect)?.text || ''
        };
      }
      
      const isCorrect = question.options[userAnswerIndex].isCorrect;
      
      if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
      
      return {
        question: question.text,
        correct: isCorrect,
        userAnswer: question.options[userAnswerIndex].text,
        correctAnswer: question.options.find(opt => opt.isCorrect)?.text || ''
      };
    });
    
    return {
      score: Math.round((correctCount / questions.length) * 100),
      correctCount,
      incorrectCount,
      totalQuestions: questions.length,
      questionResults,
      timeSpent: questions.length * 60 - timeLeft
    };
  };
  
  const isAnswered = (questionIndex) => answers[questionIndex] !== null;
  const currentQuestionAnswered = isAnswered(currentQuestion);
  const allQuestionsAnswered = answers.every(answer => answer !== null);
  
  // Handle auto-submit when time expires
  if (timeLeft <= 0 && !completed) {
    handleSubmit();
  }
  
  return (
    <div className="pre-assessment-container">
      <div className="assessment-header">
        <h2>Pre-Assessment</h2>
        <div className="timer">Time Remaining: {formatTime(timeLeft)}</div>
      </div>
      
      <div className="question-progress">
        <div className="progress-text">
          Question {currentQuestion + 1} of {questions.length}
        </div>
        <div className="progress-indicators">
          {questions.map((_, index) => (
            <div 
              key={index}
              className={`indicator ${index === currentQuestion ? 'current' : ''} ${isAnswered(index) ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(index)}
            />
          ))}
        </div>
      </div>
      
      <div className="question-container">
        <h3 className="question-text">{questions[currentQuestion].text}</h3>
        
        <div className="options-list">
          {questions[currentQuestion].options.map((option, index) => (
            <div 
              key={index}
              className={`option ${answers[currentQuestion] === index ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(index)}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option.text}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="assessment-footer">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        
        {currentQuestion < questions.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!currentQuestionAnswered}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered}
          >
            Submit Assessment
          </Button>
        )}
      </div>
    </div>
  );
};

export default PreAssessment;