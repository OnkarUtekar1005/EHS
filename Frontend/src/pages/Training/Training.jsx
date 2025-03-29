import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import PreAssessment from '../../components/user/PreAssessment';
import ModuleLearning from '../../components/user/ModuleLearning';
import PostAssessment from '../../components/user/PostAssessment';
import Results from '../../components/user/Results';
import { assessmentService } from '../../services/assessment.service';
//import './Training.scss';

// Training phases
const PHASES = {
  PRE_ASSESSMENT: 'pre-assessment',
  MODULE_LEARNING: 'module-learning',
  POST_ASSESSMENT: 'post-assessment',
  RESULTS: 'results'
};

const Training = () => {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  
  const [currentPhase, setCurrentPhase] = useState(PHASES.PRE_ASSESSMENT);
  const [training, setTraining] = useState(null);
  const [preAssessmentResults, setPreAssessmentResults] = useState(null);
  const [postAssessmentResults, setPostAssessmentResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const data = await assessmentService.getTrainingById(trainingId);
        setTraining(data);
      } catch (error) {
        setError('Failed to load training. Please try again.');
        console.error('Error fetching training:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTraining();
  }, [trainingId]);

  const handlePreAssessmentComplete = (results) => {
    setPreAssessmentResults(results);
    setCurrentPhase(PHASES.MODULE_LEARNING);
  };

  const handleModuleLearningComplete = () => {
    setCurrentPhase(PHASES.POST_ASSESSMENT);
  };

  const handlePostAssessmentComplete = (results) => {
    setPostAssessmentResults(results);
    setCurrentPhase(PHASES.RESULTS);
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <div className="loading">Loading training...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="training-container">
      <Header />
      <div className="training-content">
        <div className="training-header">
          <h2>{training.title}</h2>
          <div className="phase-indicator">
            {Object.values(PHASES).map((phase) => (
              <div 
                key={phase}
                className={`phase ${currentPhase === phase ? 'active' : ''}`}
              >
                {phase.replace('-', ' ')}
              </div>
            ))}
          </div>
        </div>

        <div className="training-body">
          {currentPhase === PHASES.PRE_ASSESSMENT && (
            <PreAssessment 
              questions={training.preAssessment.questions}
              onComplete={handlePreAssessmentComplete}
            />
          )}

          {currentPhase === PHASES.MODULE_LEARNING && (
            <ModuleLearning 
              content={training.learningModule}
              onComplete={handleModuleLearningComplete}
            />
          )}

          {currentPhase === PHASES.POST_ASSESSMENT && (
            <PostAssessment 
              questions={training.postAssessment.questions}
              onComplete={handlePostAssessmentComplete}
            />
          )}

          {currentPhase === PHASES.RESULTS && (
            <Results 
              preAssessment={preAssessmentResults}
              postAssessment={postAssessmentResults}
              onFinish={handleFinish}
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default Training;