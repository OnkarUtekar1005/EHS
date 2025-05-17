import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new CourseView component
    navigate(`/course/${courseId}`, { replace: true });
  }, [courseId, navigate]);

  return null;
};

export default CourseDetail;