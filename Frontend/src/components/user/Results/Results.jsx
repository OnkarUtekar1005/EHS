import React from 'react';
import Button from '../../common/Button';
import ComparisonChart from './ComparisonChart';
//import './Results.scss';

const Results = ({ preAssessment, postAssessment, onFinish }) => {
  const improvement = postAssessment.score - preAssessment.score;
  
  return (
    <div className="results-container">
      <h2>Assessment Results</h2>
      
      <div className="score-summary">
        <div className="score-card pre-score">
          <h3>Pre-Assessment</h3>
          <div className="score-value">{preAssessment.score}%</div>
          <div className="score-details">
            <p>{preAssessment.correctCount} correct out of {preAssessment.totalQuestions}</p>
          </div>
        </div>
        
        <div className="improvement-indicator">
          <div className={`arrow ${improvement >= 0 ? 'positive' : 'negative'}`}>
            {improvement >= 0 ? '↑' : '↓'}
          </div>
          <div className="improvement-value">
            {improvement >= 0 ? '+' : ''}{improvement}%
          </div>
        </div>
        
        <div className="score-card post-score">
          <h3>Post-Assessment</h3>
          <div className="score-value">{postAssessment.score}%</div>
          <div className="score-details">
            <p>{postAssessment.correctCount} correct out of {postAssessment.totalQuestions}</p>
          </div>
        </div>
      </div>
      
      <div className="comparison-chart">
        <h3>Score Comparison</h3>
        <ComparisonChart 
          preScore={preAssessment.score}
          postScore={postAssessment.score}
        />
      </div>
      
      <div className="question-comparison">
        <h3>Detailed Performance</h3>
        
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Pre-Assessment</th>
              <th>Post-Assessment</th>
              <th>Improvement</th>
            </tr>
          </thead>
          <tbody>
            {preAssessment.questionResults.map((preResult, index) => {
              const postResult = postAssessment.questionResults[index];
              const improved = !preResult.correct && postResult.correct;
              const worsened = preResult.correct && !postResult.correct;
              const unchanged = preResult.correct === postResult.correct;
              
              return (
                <tr key={index}>
                  <td>{preResult.question}</td>
                  <td className={preResult.correct ? 'correct' : 'incorrect'}>
                    {preResult.correct ? 'Correct' : 'Incorrect'}
                  </td>
                  <td className={postResult.correct ? 'correct' : 'incorrect'}>
                    {postResult.correct ? 'Correct' : 'Incorrect'}
                  </td>
                  <td className={`
                    ${improved ? 'improved' : ''} 
                    ${worsened ? 'worsened' : ''} 
                    ${unchanged ? 'unchanged' : ''}
                  `}>
                    {improved && '↑ Improved'}
                    {worsened && '↓ Worsened'}
                    {unchanged && preResult.correct && '✓ Maintained'}
                    {unchanged && !preResult.correct && '✗ No Change'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="results-footer">
        <Button
          onClick={onFinish}
          className="finish-button"
        >
          Complete Training
        </Button>
      </div>
    </div>
  );
};

export default Results;