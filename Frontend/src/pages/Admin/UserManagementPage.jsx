// src/pages/Admin/UserManagementPage.jsx
import React, { useState } from 'react';
import './UserManagementPage.scss';

const UserManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  
  // Mock users data
  const users = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      domain: 'Safety Officer',
      status: 'Active',
      completedModules: 5,
      inProgressModules: 2
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      domain: 'Fire Safety',
      status: 'Active',
      completedModules: 3,
      inProgressModules: 1
    },
    {
      id: 3,
      name: 'Michael Johnson',
      email: 'michael.johnson@example.com',
      domain: 'Chemical Safety',
      status: 'Inactive',
      completedModules: 0,
      inProgressModules: 0
    },
    {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah.williams@example.com',
      domain: 'Environmental Safety',
      status: 'Active',
      completedModules: 7,
      inProgressModules: 0
    },
    {
      id: 5,
      name: 'Robert Brown',
      email: 'robert.brown@example.com',
      domain: 'Safety Officer',
      status: 'Pending',
      completedModules: 0,
      inProgressModules: 0
    }
  ];
  
  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDomain = selectedDomain === '' || 
      user.domain === selectedDomain;
    
    const matchesStatus = selectedStatus === '' || 
      user.status === selectedStatus;
    
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
  
  const toggleAddUserModal = () => {
    setIsAddUserModalOpen(!isAddUserModalOpen);
  };
  
  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>User Management</h1>
        <button 
          className="btn-primary"
          onClick={toggleAddUserModal}
        >
          Add New User
        </button>
      </div>
      
      <div className="filters-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users..."
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
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Domain</th>
              <th>Status</th>
              <th>Completed</th>
              <th>In Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <input type="checkbox" />
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.domain}</td>
                <td>
                  <span className={`status-badge status-${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.completedModules}</td>
                <td>{user.inProgressModules}</td>
                <td className="actions-cell">
                  <button className="btn-sm btn-outline">Edit</button>
                  <button className="btn-sm">View</button>
                  <button className="btn-sm btn-danger">Deactivate</button>
                </td>
              </tr>
            ))}
            
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-state">
                  No users found matching your filters.
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
      
      {isAddUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New User</h2>
              <button 
                className="close-button"
                onClick={toggleAddUserModal}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="domain">Domain</label>
                <select id="domain">
                  <option value="">Select Domain</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Fire Safety">Fire Safety</option>
                  <option value="Chemical Safety">Chemical Safety</option>
                  <option value="Environmental Safety">Environmental Safety</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  type="text"
                  id="position"
                  placeholder="Enter position"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  type="text"
                  id="department"
                  placeholder="Enter department"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-outline"
                onClick={toggleAddUserModal}
              >
                Cancel
              </button>
              <button className="btn-primary">
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;