// src/pages/Admin/ReportsPage.jsx
import React, { useState } from 'react';
import './ReportsPage.scss';

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [exportFormat, setExportFormat] = useState('pdf');
  
  const handleReportChange = (e) => {
    setSelectedReport(e.target.value);
  };
  
  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };
  
  const handleExportFormatChange = (e) => {
    setExportFormat(e.target.value);
  };
  
  const handleExport = () => {
    console.log(`Exporting ${selectedReport} report as ${exportFormat}`);
    // In a real app, this would trigger the export functionality
  };
  
  return (
    <div className="reports-page">
      <h1>Reports</h1>
      <p>Generate and analyze training performance reports</p>
      
      <div className="reports-controls">
        <div className="form-group">
          <label htmlFor="reportType">Report Type</label>
          <select
            id="reportType"
            value={selectedReport}
            onChange={handleReportChange}
          >
            <option value="overview">Training Overview</option>
            <option value="completion">Completion Rates</option>
            <option value="domain">Domain Performance</option>
            <option value="user">User Progress</option>
            <option value="improvement">Knowledge Improvement</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="dateRange">Date Range</label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={handleDateRangeChange}
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last3months">Last 3 Months</option>
            <option value="last6months">Last 6 Months</option>
            <option value="lastyear">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        <div className="export-controls">
          <div className="form-group">
            <label htmlFor="exportFormat">Export Format</label>
            <select
              id="exportFormat"
              value={exportFormat}
              onChange={handleExportFormatChange}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          
          <button className="btn-primary" onClick={handleExport}>
            Export Report
          </button>
        </div>
      </div>
      
      <div className="report-container">
        {selectedReport === 'overview' && (
          <div className="report overview-report">
            <h2>Training Overview</h2>
            
            <div className="report-stats">
              <div className="stat-card">
                <h3>Total Trainings</h3>
                <p className="stat-value">15</p>
              </div>
              <div className="stat-card">
                <h3>Total Users</h3>
                <p className="stat-value">124</p>
              </div>
              <div className="stat-card">
                <h3>Completed Sessions</h3>
                <p className="stat-value">287</p>
              </div>
              <div className="stat-card">
                <h3>Avg. Completion Rate</h3>
                <p className="stat-value">72%</p>
              </div>
            </div>
            
            <div className="chart-container">
              <h3>Training Completions Over Time</h3>
              <div className="chart-placeholder">
                Line chart showing training completions by month would appear here
              </div>
            </div>
            
            <div className="report-grid">
              <div className="chart-container">
                <h3>Top Performing Modules</h3>
                <div className="chart-placeholder">
                  Bar chart showing highest completion rates would appear here
                </div>
              </div>
              
              <div className="chart-container">
                <h3>Domain Participation</h3>
                <div className="chart-placeholder">
                  Pie chart showing distribution of users across domains would appear here
                </div>
              </div>
            </div>
            
            <div className="report-table">
              <h3>Recent Training Activities</h3>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>Date</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>John Doe</td>
                    <td>Workplace Safety Fundamentals</td>
                    <td>Completed</td>
                    <td>Mar 25, 2025</td>
                    <td>85%</td>
                  </tr>
                  <tr>
                    <td>Jane Smith</td>
                    <td>Fire Safety Protocols</td>
                    <td>Started</td>
                    <td>Mar 24, 2025</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>Michael Johnson</td>
                    <td>Chemical Handling Safety</td>
                    <td>Completed</td>
                    <td>Mar 23, 2025</td>
                    <td>92%</td>
                  </tr>
                  <tr>
                    <td>Sarah Williams</td>
                    <td>Environmental Protection Guidelines</td>
                    <td>In Progress</td>
                    <td>Mar 22, 2025</td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {selectedReport === 'completion' && (
          <div className="report completion-report">
            <h2>Completion Rates Report</h2>
            <div className="chart-placeholder large">
              Detailed completion rate metrics would appear here
            </div>
          </div>
        )}
        
        {selectedReport === 'domain' && (
          <div className="report domain-report">
            <h2>Domain Performance Report</h2>
            <div className="chart-placeholder large">
              Domain-specific performance metrics would appear here
            </div>
          </div>
        )}
        
        {selectedReport === 'user' && (
          <div className="report user-report">
            <h2>User Progress Report</h2>
            <div className="chart-placeholder large">
              Individual user progress metrics would appear here
            </div>
          </div>
        )}
        
        {selectedReport === 'improvement' && (
          <div className="report improvement-report">
            <h2>Knowledge Improvement Report</h2>
            <div className="chart-placeholder large">
              Pre vs post assessment improvement metrics would appear here
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;