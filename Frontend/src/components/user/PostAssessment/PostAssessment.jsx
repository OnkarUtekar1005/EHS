import React from 'react';
import PreAssessment from '../PreAssessment';
//import './PostAssessment.scss';

// PostAssessment reuses most of the PreAssessment component logic
const PostAssessment = ({ questions, onComplete }) => {
  return (
    <div className="post-assessment-container">
      <PreAssessment 
        questions={questions}
        onComplete={onComplete}
      />
    </div>
  );
};

export default PostAssessment;
