// src/pages/Admin/ModuleCreatorPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ModuleCreatorPage.scss';

const ModuleCreatorPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [moduleData, setModuleData] = useState({
    title: '',
    description: '',
    domain: '',
    preAssessment: {
      questions: [{ text: '', options: ['', '', '', ''], correctAnswer: '' }],
      timeLimit: 15
    },
    learning: {
      sections: [{ title: '', content: '', type: 'text' }]
    },
    postAssessment: {
      questions: [{ text: '', options: ['', '', '', ''], correctAnswer: '' }],
      timeLimit: 15
    }
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModuleData({
      ...moduleData,
      [name]: value
    });
  };
  
  const handleDomainChange = (e) => {
    setModuleData({
      ...moduleData,
      domain: e.target.value
    });
  };
  
  const handlePreAssessmentChange = (index, field, value) => {
    const updatedQuestions = [...moduleData.preAssessment.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    
    setModuleData({
      ...moduleData,
      preAssessment: {
        ...moduleData.preAssessment,
        questions: updatedQuestions
      }
    });
  };
  
  const handleOptionChange = (questionIndex, optionIndex, value, assessmentType) => {
    const updatedQuestions = [...moduleData[assessmentType].questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    
    setModuleData({
      ...moduleData,
      [assessmentType]: {
        ...moduleData[assessmentType],
        questions: updatedQuestions
      }
    });
  };
  
  const handleCorrectAnswerChange = (questionIndex, optionIndex, assessmentType) => {
    const updatedQuestions = [...moduleData[assessmentType].questions];
    updatedQuestions[questionIndex].correctAnswer = updatedQuestions[questionIndex].options[optionIndex];
    
    setModuleData({
      ...moduleData,
      [assessmentType]: {
        ...moduleData[assessmentType],
        questions: updatedQuestions
      }
    });
  };
  
  const addQuestion = (assessmentType) => {
    const updatedData = { ...moduleData };
    updatedData[assessmentType].questions.push({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: ''
    });
    
    setModuleData(updatedData);
  };
  
  const addLearningSection = () => {
    const updatedData = { ...moduleData };
    updatedData.learning.sections.push({
      title: '',
      content: '',
      type: 'text'
    });
    
    setModuleData(updatedData);
  };
  
  const handleLearningChange = (index, field, value) => {
    const updatedSections = [...moduleData.learning.sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    
    setModuleData({
      ...moduleData,
      learning: {
        ...moduleData.learning,
        sections: updatedSections
      }
    });
  };
  
  const handleSubmit = () => {
    // In a real app, you would submit the data to your backend
    console.log('Submitting module data:', moduleData);
    navigate('/admin/training-manager');
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  return (
    <div className="module-creator-page">
      <h1>Create Training Module</h1>
      <p>Design a new training module with assessments</p>
      
      <div className="progress-bar-container">
        <div className="progress-steps">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Basic Info</div>
          </div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Pre-Assessment</div>
          </div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Learning Material</div>
          </div>
          <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Post-Assessment</div>
          </div>
          <div className={`progress-step ${currentStep >= 5 ? 'active' : ''}`}>
            <div className="step-number">5</div>
            <div className="step-label">Review</div>
          </div>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(currentStep - 1) * 25}%` }}
          ></div>
        </div>
      </div>
      
      <div className="form-container">
        {currentStep === 1 && (
          <div className="step-content">
            <h2>Basic Information</h2>
            <p>Enter the core details for this training module</p>
            
            <div className="form-group">
              <label htmlFor="title">Module Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={moduleData.title}
                onChange={handleInputChange}
                placeholder="Enter a clear, descriptive title"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={moduleData.description}
                onChange={handleInputChange}
                placeholder="Describe what employees will learn in this module"
                rows="4"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="domain">Domain</label>
              <select
                id="domain"
                value={moduleData.domain}
                onChange={handleDomainChange}
              >
                <option value="">Select a domain</option>
                <option value="safety-officer">Safety Officer</option>
                <option value="fire-safety">Fire Safety</option>
                <option value="chemical-safety">Chemical Safety</option>
                <option value="environmental-safety">Environmental Safety</option>
              </select>
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="step-content">
            <h2>Pre-Assessment</h2>
            <p>Create questions to gauge initial knowledge</p>
            
            <div className="form-group">
              <label htmlFor="preTimeLimit">Time Limit (minutes)</label>
              <input
                type="number"
                id="preTimeLimit"
                value={moduleData.preAssessment.timeLimit}
                onChange={(e) => setModuleData({
                  ...moduleData,
                  preAssessment: {
                    ...moduleData.preAssessment,
                    timeLimit: parseInt(e.target.value)
                  }
                })}
                min="5"
                max="60"
              />
            </div>
            
            <div className="questions-container">
              {moduleData.preAssessment.questions.map((question, qIndex) => (
                <div key={qIndex} className="question-card">
                  <h3>Question {qIndex + 1}</h3>
                  
                  <div className="form-group">
                    <label>Question Text</label>
                    <textarea
                      value={question.text}
                      onChange={(e) => handlePreAssessmentChange(qIndex, 'text', e.target.value)}
                      placeholder="Enter your question"
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <div className="options-container">
                    <label>Answer Options</label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="option-row">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value, 'preAssessment')}
                          placeholder={`Option ${oIndex + 1}`}
                        />
                        <label className="correct-label">
                          <input
                            type="radio"
                            name={`correct-pre-${qIndex}`}
                            checked={question.correctAnswer === option}
                            onChange={() => handleCorrectAnswerChange(qIndex, oIndex, 'preAssessment')}
                            disabled={!option}
                          />
                          Correct Answer
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => addQuestion('preAssessment')}
              >
                Add Question
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="step-content">
            <h2>Learning Material</h2>
            <p>Create content sections for the training module</p>
            
            <div className="sections-container">
              {moduleData.learning.sections.map((section, index) => (
                <div key={index} className="section-card">
                  <h3>Section {index + 1}</h3>
                  
                  <div className="form-group">
                    <label>Section Title</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleLearningChange(index, 'title', e.target.value)}
                      placeholder="Enter section title"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Content Type</label>
                    <select
                      value={section.type}
                      onChange={(e) => handleLearningChange(index, 'type', e.target.value)}
                    >
                      <option value="text">Text Content</option>
                      <option value="video">Video</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                  
                  {section.type === 'text' && (
                    <div className="form-group">
                      <label>Content</label>
                      <textarea
                        value={section.content}
                        onChange={(e) => handleLearningChange(index, 'content', e.target.value)}
                        placeholder="Enter section content"
                        rows="6"
                      ></textarea>
                    </div>
                  )}
                  
                  {section.type === 'video' && (
                    <div className="form-group">
                      <label>Video URL</label>
                      <input
                        type="url"
                        value={section.content}
                        onChange={(e) => handleLearningChange(index, 'content', e.target.value)}
                        placeholder="Enter video URL"
                      />
                    </div>
                  )}
                  
                  {section.type === 'image' && (
                    <div className="form-group">
                      <label>Image URL</label>
                      <input
                        type="url"
                        value={section.content}
                        onChange={(e) => handleLearningChange(index, 'content', e.target.value)}
                        placeholder="Enter image URL"
                      />
                    </div>
                  )}
                </div>
              ))}
              
              <button 
                type="button" 
                className="btn-secondary"
                onClick={addLearningSection}
              >
                Add Section
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 4 && (
          <div className="step-content">
            <h2>Post-Assessment</h2>
            <p>Create questions to evaluate knowledge after training</p>
            
            <div className="form-group">
              <label htmlFor="postTimeLimit">Time Limit (minutes)</label>
              <input
                type="number"
                id="postTimeLimit"
                value={moduleData.postAssessment.timeLimit}
                onChange={(e) => setModuleData({
                  ...moduleData,
                  postAssessment: {
                    ...moduleData.postAssessment,
                    timeLimit: parseInt(e.target.value)
                  }
                })}
                min="5"
                max="60"
              />
            </div>
            
            <div className="questions-container">
              {moduleData.postAssessment.questions.map((question, qIndex) => (
                <div key={qIndex} className="question-card">
                  <h3>Question {qIndex + 1}</h3>
                  
                  <div className="form-group">
                    <label>Question Text</label>
                    <textarea
                      value={question.text}
                      onChange={(e) => {
                        const updatedQuestions = [...moduleData.postAssessment.questions];
                        updatedQuestions[qIndex].text = e.target.value;
                        setModuleData({
                          ...moduleData,
                          postAssessment: {
                            ...moduleData.postAssessment,
                            questions: updatedQuestions
                          }
                        });
                      }}
                      placeholder="Enter your question"
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <div className="options-container">
                    <label>Answer Options</label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="option-row">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value, 'postAssessment')}
                          placeholder={`Option ${oIndex + 1}`}
                        />
                        <label className="correct-label">
                          <input
                            type="radio"
                            name={`correct-post-${qIndex}`}
                            checked={question.correctAnswer === option}
                            onChange={() => handleCorrectAnswerChange(qIndex, oIndex, 'postAssessment')}
                            disabled={!option}
                          />
                          Correct Answer
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => addQuestion('postAssessment')}
              >
                Add Question
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 5 && (
          <div className="step-content">
            <h2>Review Module</h2>
            <p>Review your training module before publishing</p>
            
            <div className="review-section">
              <h3>Basic Information</h3>
              <div className="review-item">
                <span className="review-label">Title:</span>
                <span className="review-value">{moduleData.title || '(Not provided)'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Description:</span>
                <span className="review-value">{moduleData.description || '(Not provided)'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Domain:</span>
                <span className="review-value">{moduleData.domain || '(Not selected)'}</span>
              </div>
            </div>
            
            <div className="review-section">
              <h3>Pre-Assessment</h3>
              <div className="review-item">
                <span className="review-label">Time Limit:</span>
                <span className="review-value">{moduleData.preAssessment.timeLimit} minutes</span>
              </div>
              <div className="review-item">
                <span className="review-label">Questions:</span>
                <span className="review-value">{moduleData.preAssessment.questions.length}</span>
              </div>
            </div>
            
            <div className="review-section">
              <h3>Learning Material</h3>
              <div className="review-item">
                <span className="review-label">Sections:</span>
                <span className="review-value">{moduleData.learning.sections.length}</span>
              </div>
            </div>
            
            <div className="review-section">
              <h3>Post-Assessment</h3>
              <div className="review-item">
                <span className="review-label">Time Limit:</span>
                <span className="review-value">{moduleData.postAssessment.timeLimit} minutes</span>
              </div>
              <div className="review-item">
                <span className="review-label">Questions:</span>
                <span className="review-value">{moduleData.postAssessment.questions.length}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn-outline"
              onClick={prevStep}
            >
              Previous
            </button>
          )}
          
          {currentStep < 5 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={nextStep}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn-success"
              onClick={handleSubmit}
            >
              Create Module
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleCreatorPage;