// src/pages/Settings/UserSettingsPage.jsx
import React, { useState } from 'react';
import './UserSettingsPage.scss';

const UserSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Mock user data
  const userData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    employeeId: 'EMP001',
    position: 'Safety Officer',
    department: 'Operations',
    phone: '(555) 123-4567',
    notifications: {
      emailAssignments: true,
      emailReminders: true,
      emailCertificates: true
    },
    account: {
      language: 'English',
      timeZone: 'America/New_York'
    }
  };
  
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p>Manage your account preferences</p>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button 
            className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
          <button 
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Information</h2>
              <p>Manage your personal information</p>
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  defaultValue={userData.name} 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  defaultValue={userData.email} 
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employeeId">Employee ID</label>
                  <input 
                    type="text" 
                    id="employeeId" 
                    defaultValue={userData.employeeId}
                    disabled
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="position">Position</label>
                  <input 
                    type="text" 
                    id="position" 
                    defaultValue={userData.position}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input 
                    type="text" 
                    id="department" 
                    defaultValue={userData.department}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    defaultValue={userData.phone}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <p>Manage how you receive notifications</p>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    defaultChecked={userData.notifications.emailAssignments}
                  />
                  <span>Email notifications for new training assignments</span>
                </label>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    defaultChecked={userData.notifications.emailReminders}
                  />
                  <span>Email reminders for upcoming deadlines</span>
                </label>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    defaultChecked={userData.notifications.emailCertificates}
                  />
                  <span>Email notifications for completed certificates</span>
                </label>
              </div>
              
              <div className="form-actions">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}
          
          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>Account Settings</h2>
              <p>Manage your account preferences</p>
              
              <div className="form-group">
                <label htmlFor="language">Language</label>
                <select id="language" defaultValue={userData.account.language}>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="timezone">Time Zone</label>
                <select id="timezone" defaultValue={userData.account.timeZone}>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}
          
          {activeTab === 'password' && (
            <div className="settings-section">
              <h2>Change Password</h2>
              <p>Update your account password</p>
              
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input 
                  type="password" 
                  id="currentPassword" 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input 
                  type="password" 
                  id="newPassword" 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                />
              </div>
              
              <div className="form-actions">
                <button className="btn-primary">Update Password</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;