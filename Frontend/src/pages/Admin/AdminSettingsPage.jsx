// src/pages/Admin/AdminSettingsPage.jsx
import React, { useState } from 'react';
import './AdminSettingsPage.scss';

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  // Mock settings data
  const [settings, setSettings] = useState({
    general: {
      siteName: 'EHS E-Learning Platform',
      logoUrl: '/logo.png',
      primaryColor: '#4f46e5',
      defaultLanguage: 'English'
    },
    notifications: {
      sendWelcomeEmail: true,
      sendAssignmentNotifications: true,
      sendCompletionNotifications: true,
      sendReminderNotifications: true,
      reminderFrequency: 'weekly'
    },
    assessment: {
      passingScore: 70,
      showResults: true,
      allowRetakes: true,
      maxRetakes: 3,
      requiredImprovement: true
    },
    ai: {
      enableAIAssistant: true,
      confidenceThreshold: 75,
      reviewRequired: true,
      defaultQuestionCount: 10
    }
  });
  
  const handleInputChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };
  
  const handleCheckboxChange = (section, field) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: !settings[section][field]
      }
    });
  };
  
  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
    // In a real app, this would save the settings to the backend
    alert('Settings saved successfully!');
  };
  
  return (
    <div className="admin-settings-page">
      <h1>Admin Settings</h1>
      <p>Configure the platform settings</p>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`tab-button ${activeTab === 'assessment' ? 'active' : ''}`}
            onClick={() => setActiveTab('assessment')}
          >
            Assessment
          </button>
          <button
            className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI Settings
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>General Settings</h2>
              <p>Configure basic platform settings</p>
              
              <div className="form-group">
                <label htmlFor="siteName">Platform Name</label>
                <input
                  type="text"
                  id="siteName"
                  value={settings.general.siteName}
                  onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="logoUrl">Logo URL</label>
                <input
                  type="text"
                  id="logoUrl"
                  value={settings.general.logoUrl}
                  onChange={(e) => handleInputChange('general', 'logoUrl', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="primaryColor">Primary Color</label>
                <div className="color-picker">
                  <input
                    type="color"
                    id="primaryColor"
                    value={settings.general.primaryColor}
                    onChange={(e) => handleInputChange('general', 'primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={settings.general.primaryColor}
                    onChange={(e) => handleInputChange('general', 'primaryColor', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="defaultLanguage">Default Language</label>
                <select
                  id="defaultLanguage"
                  value={settings.general.defaultLanguage}
                  onChange={(e) => handleInputChange('general', 'defaultLanguage', e.target.value)}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Settings</h2>
              <p>Configure email notifications</p>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sendWelcomeEmail}
                    onChange={() => handleCheckboxChange('notifications', 'sendWelcomeEmail')}
                  />
                  <span>Send welcome email to new users</span>
                </label>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sendAssignmentNotifications}
                    onChange={() => handleCheckboxChange('notifications', 'sendAssignmentNotifications')}
                  />
                  <span>Send notifications for new training assignments</span>
                </label>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sendCompletionNotifications}
                    onChange={() => handleCheckboxChange('notifications', 'sendCompletionNotifications')}
                  />
                  <span>Send notifications when trainings are completed</span>
                </label>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sendReminderNotifications}
                    onChange={() => handleCheckboxChange('notifications', 'sendReminderNotifications')}
                  />
                  <span>Send reminder notifications for incomplete trainings</span>
                </label>
              </div>
              
              {settings.notifications.sendReminderNotifications && (
                <div className="form-group indented">
                  <label htmlFor="reminderFrequency">Reminder Frequency</label>
                  <select
                    id="reminderFrequency"
                    value={settings.notifications.reminderFrequency}
                    onChange={(e) => handleInputChange('notifications', 'reminderFrequency', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'assessment' && (
            <div className="settings-section">
              <h2>Assessment Settings</h2>
              <p>Configure assessment behavior</p>
              
              <div className="form-group">
                <label htmlFor="passingScore">Passing Score (%)</label>
                <input
                  type="number"
                  id="passingScore"
                  min="0"
                  max="100"
                  value={settings.assessment.passingScore}
                  onChange={(e) => handleInputChange('assessment', 'passingScore', parseInt(e.target.value))}
                />
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.assessment.showResults}
                    onChange={() => handleCheckboxChange('assessment', 'showResults')}
                  />
                  <span>Show detailed results after assessment</span>
                </label>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.assessment.allowRetakes}
                    onChange={() => handleCheckboxChange('assessment', 'allowRetakes')}
                  />
                  <span>Allow retaking failed assessments</span>
                </label>
              </div>
              
              {settings.assessment.allowRetakes && (
                <div className="form-group indented">
                  <label htmlFor="maxRetakes">Maximum Retakes</label>
                  <input
                    type="number"
                    id="maxRetakes"
                    min="1"
                    max="10"
                    value={settings.assessment.maxRetakes}
                    onChange={(e) => handleInputChange('assessment', 'maxRetakes', parseInt(e.target.value))}
                  />
                </div>
              )}
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.assessment.requiredImprovement}
                    onChange={() => handleCheckboxChange('assessment', 'requiredImprovement')}
                  />
                  <span>Require improvement between pre and post assessment</span>
                </label>
              </div>
            </div>
          )}
          
          {activeTab === 'ai' && (
            <div className="settings-section">
              <h2>AI Assistant Settings</h2>
              <p>Configure AI-assisted training creation</p>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.ai.enableAIAssistant}
                    onChange={() => handleCheckboxChange('ai', 'enableAIAssistant')}
                  />
                  <span>Enable AI Assistant for training creation</span>
                </label>
              </div>
              
              <div className="form-group">
                <label htmlFor="confidenceThreshold">AI Confidence Threshold (%)</label>
                <input
                  type="number"
                  id="confidenceThreshold"
                  min="0"
                  max="100"
                  value={settings.ai.confidenceThreshold}
                  onChange={(e) => handleInputChange('ai', 'confidenceThreshold', parseInt(e.target.value))}
                />
                <p className="field-help">Minimum confidence level required for AI-generated content</p>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.ai.reviewRequired}
                    onChange={() => handleCheckboxChange('ai', 'reviewRequired')}
                  />
                  <span>Require admin review of AI-generated content</span>
                </label>
              </div>
              
              <div className="form-group">
                <label htmlFor="defaultQuestionCount">Default Question Count</label>
                <input
                  type="number"
                  id="defaultQuestionCount"
                  min="1"
                  max="50"
                  value={settings.ai.defaultQuestionCount}
                  onChange={(e) => handleInputChange('ai', 'defaultQuestionCount', parseInt(e.target.value))}
                />
                <p className="field-help">Number of questions to generate by default</p>
              </div>
            </div>
          )}
          
          <div className="form-actions">
            <button className="btn-outline">Reset to Defaults</button>
            <button className="btn-primary" onClick={handleSaveSettings}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;