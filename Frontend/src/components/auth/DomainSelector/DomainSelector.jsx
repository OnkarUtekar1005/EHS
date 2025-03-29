import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Card from '../../common/Card';
import './DomainSelector.scss';

const domains = [
  { id: 'safety', name: 'Safety Officer', icon: 'safety.svg' },
  { id: 'fire', name: 'Fire Safety Officer', icon: 'fire.svg' },
  { id: 'hazmat', name: 'Hazardous Materials Specialist', icon: 'hazmat.svg' },
];

const DomainSelector = () => {
  const { selectDomain } = useAuth();
  const navigate = useNavigate();

  const handleDomainSelect = (domain) => {
    selectDomain(domain);
    navigate('/dashboard');
  };

  return (
    <div className="domain-selector-container">
      <h2>Select Your Domain</h2>
      <div className="domains-grid">
        {domains.map((domain) => (
          <Card 
            key={domain.id}
            className="domain-card"
            onClick={() => handleDomainSelect(domain)}
            clickable
          >
            <img 
              src={`/assets/images/ehs-icons/${domain.icon}`} 
              alt={domain.name} 
              className="domain-icon"
            />
            <h3>{domain.name}</h3>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DomainSelector;
