// src/pages/Admin/TrainingManagerPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './TrainingManagerPage.scss';

const TrainingManagerPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Mock training modules data
  const trainings = [
    {
      id: 1,
      title: 'Workplace Safety Fundamentals',
      domain: 'Safety Officer',
      status: 'Active',
      createdAt: '2025-03-15',
      participants: 45,
      completionRate: 78
    },
    {
      id: 2,
      title: 'Fire Safety Protocols',
      domain: 'Fire Safety',
      status: 'Active',
      createdAt: '2025-03-10',
      participants: 32,
      completionRate: 65
    },
    {
      id: 3,
      title: 'Chemical Handling Safety',
      domain: 'Chemical Safety',
      status: 'Draft',
      createdAt: '2025-03-05',
      participants: 0,
      completionRate: 0
    },
    {
      id: 4,
      title: 'Environmental Protection Guidelines',
      domain: 'Environmental Safety',
      status: 'Active',
      createdAt: '2025-02-28',
      participants: 28,
      completionRate: 42
    },
    {
      id: 5,
      title: 'Personal Protective Equipment',
      domain: 'Safety Officer',
      status: 'Inactive',
      createdAt: '2025-02-20',
      participants: 56,
      completionRate: 91
    }
  ];
  
  // Filter trainings based on search and filters
  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch = searchTerm === '' || 
      training.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDomain = selectedDomain === '' || 
      training.domain === selectedDomain;
    
    const matchesStatus = selectedStatus === '' || 
      training.status === selectedStatus;
    
    return matchesSearch && matchesDomain && matchesStatus;
  });
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleDomainChange = (e) => {
    setSelectedDomain(e.target.value);
  };
  
  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };
  
  return (
    <div className="training-manager-page">
      <div className="page-header">
        <h1>Training Manager</h1>
        <Link to="/admin/training-manager/create" className="btn-primary">
          Create New Training
        </Link>
      </div>
      
      <div className="filters-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search trainings..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="domainFilter">Domain</label>
            <select
              id="domainFilter"
              value={selectedDomain}
              onChange={handleDomainChange}
            >
              <option value="">All Domains</option>
              <option value="Safety Officer">Safety Officer</option>
              <option value="Fire Safety">Fire Safety</option>
              <option value="Chemical Safety">Chemical Safety</option>
              <option value="Environmental Safety">Environmental Safety</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="statusFilter">Status</label>
            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={handleStatusChange}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="trainings-table-container">
        <table className="trainings-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Domain</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Participants</th>
              <th>Completion Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrainings.map((training) => (
              <tr key={training.id}>
                <td>{training.title}</td>
                <td>{training.domain}</td>
                <td>
                  <span className={`status-badge status-${training.status.toLowerCase()}`}>
                    {training.status}
                  </span>
                </td>
                <td>{new Date(training.createdAt).toLocaleDateString()}</td>
                <td>{training.participants}</td>
                <td>{training.completionRate}%</td>
                <td className="actions-cell">
                  <button className="btn-sm btn-outline">Edit</button>
                  <button className="btn-sm">View</button>
                  <button className="btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))}
            
            {filteredTrainings.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">
                  No trainings found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bulk-actions">
        <select className="bulk-action-select">
          <option value="">Bulk Actions</option>
          <option value="activate">Activate Selected</option>
          <option value="deactivate">Deactivate Selected</option>
          <option value="delete">Delete Selected</option>
        </select>
        
        <button className="btn-secondary">Apply</button>
      </div>
    </div>
  );
};

export default TrainingManagerPage;