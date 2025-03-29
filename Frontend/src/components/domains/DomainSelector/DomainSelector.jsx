// src/components/domains/DomainSelector/DomainSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import './DomainSelector.scss';

const DomainSelector = ({ domains, selectedDomain, onDomainChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleDomainSelect = (domain) => {
    onDomainChange(domain);
    setIsOpen(false);
  };

  if (!selectedDomain) return null;

  return (
    <div className="domain-selector" ref={dropdownRef}>
      <button 
        className="domain-selector-button" 
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span>{selectedDomain.name}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="domain-dropdown">
          <ul>
            {domains.map(domain => (
              <li 
                key={domain.id} 
                className={domain.id === selectedDomain.id ? 'active' : ''}
                onClick={() => handleDomainSelect(domain)}
              >
                {domain.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DomainSelector;