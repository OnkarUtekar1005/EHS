import React from 'react';
//import './MainContent.scss';

const MainContent = ({ children, className = '' }) => {
  return (
    <main className={`main-content ${className}`}>
      {children}
    </main>
  );
};

export default MainContent;