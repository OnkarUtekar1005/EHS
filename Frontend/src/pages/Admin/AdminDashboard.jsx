// src/pages/Admin/AdminDashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.scss';

const AdminDashboardPage = () => {
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <Link to="/admin/training-manager/create" className="btn-primary">
          Create New Training
        </Link>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">124</p>
        </div>
        <div className="stat-card">
          <h3>Active Modules</h3>
          <p className="stat-value">15</p>
        </div>
        <div className="stat-card">
          <h3>Completed Trainings</h3>
          <p className="stat-value">287</p>
        </div>
        <div className="stat-card">
          <h3>Avg. Improvement</h3>
          <p className="stat-value">27%</p>
        </div>
      </div>
      
      <div className="section">
        <h2>Recent Modules</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Participants</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Workplace Safety Fundamentals</td>
                <td>Safety Officer</td>
                <td>Active</td>
                <td>Mar 15, 2025</td>
                <td>45</td>
              </tr>
              <tr>
                <td>Fire Safety Protocols</td>
                <td>Fire Safety</td>
                <td>Active</td>
                <td>Mar 10, 2025</td>
                <td>32</td>
              </tr>
              <tr>
                <td>Chemical Handling Safety</td>
                <td>Chemical Safety</td>
                <td>Draft</td>
                <td>Mar 5, 2025</td>
                <td>0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;