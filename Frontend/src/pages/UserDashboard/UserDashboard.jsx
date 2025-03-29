import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import MainContent from '../../components/layout/MainContent';
import DomainSelector from '../../components/auth/DomainSelector';
import TrainingCard from '../../components/user/TrainingCard';
import { userService } from '../../services/user.service';
import './UserDashboard.scss';

const UserDashboard = () => {
  const { currentUser, selectedDomain } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch trainings if domain is selected
    if (selectedDomain) {
      const fetchTrainings = async () => {
        try {
          const data = await userService.getTrainingsByDomain(selectedDomain.id);
          setTrainings(data);
        } catch (error) {
          console.error('Failed to fetch trainings:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTrainings();
    } else {
      setLoading(false);
    }
  }, [selectedDomain]);

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content">
        <Sidebar />
        <MainContent>
          {!selectedDomain ? (
            <DomainSelector />
          ) : (
            <div className="trainings-section">
              <h2>Welcome, {currentUser.username}</h2>
              <h3>Available Trainings for {selectedDomain.name}</h3>
              
              {loading ? (
                <p>Loading trainings...</p>
              ) : trainings.length > 0 ? (
                <div className="trainings-grid">
                  {trainings.map((training) => (
                    <TrainingCard 
                      key={training.id}
                      training={training}
                    />
                  ))}
                </div>
              ) : (
                <p>No trainings available for your domain at this time.</p>
              )}
            </div>
          )}
        </MainContent>
      </div>
    </div>
  );
};

export default UserDashboard;