// src/pages/Landing.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Grid,
  Paper
} from '@mui/material';
import {
  School as SchoolIcon,
  Login as LoginIcon,
  LocalFireDepartment as FireIcon,
  HealthAndSafety as FirstAidIcon,
  Computer as CyberIcon,
  Group as CommunityIcon,
  Shield as ShieldIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { domainService } from '../services/api';
import ThinkForm from '../components/think/ThinkForm';

const Landing = () => {
  const [stats, setStats] = useState({
    totalDomains: 0,
    loading: true
  });

  // Fetch real platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [domainsResponse] = await Promise.allSettled([
          domainService.getAll().catch(() => ({ data: [] }))
        ]);

        const domains = domainsResponse.status === 'fulfilled' ? domainsResponse.value.data : [];
        
        setStats({
          totalDomains: domains.length || 5,
          loading: false
        });
      } catch (error) {
        setStats({
          totalDomains: 5,
          loading: false
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Navigation Header - Sticky */}
      <div style={{ 
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'white', 
        borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Container maxWidth="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box
                component="img"
                src="/logo-image.jpg"
                alt="Protecther Logo"
                style={{
                  width: '120px',
                  height: '96px',
                  objectFit: 'contain',
                  maxHeight: '56px',
                  transition: 'transform 0.2s ease-in-out',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              />
              <Typography variant="h6" style={{ fontWeight: 700, color: '#333' }}>
                Protecther
              </Typography>
            </div>
            
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              startIcon={<LoginIcon />}
              style={{ 
                borderRadius: '25px',
                padding: '8px 24px',
                fontWeight: 600,
                backgroundColor: '#1976d2'
              }}
            >
              Login
            </Button>
          </div>
        </Container>
      </div>

      {/* Hero Section */}
      <div 
        style={{
          minHeight: '88.55vh',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: 'white',
          padding: '80px 0'
        }}
      >
        <Container maxWidth="lg">
          <div style={{ maxWidth: '800px' }}>
            <Typography
              variant="h2"
              component="h1"
              style={{
                fontWeight: 900,
                marginBottom: '24px',
                fontSize: '3.5rem',
                lineHeight: 1.2
              }}
            >
              Transform Your Workplace Safety Knowledge
            </Typography>
            
            <Typography
              variant="h6"
              style={{
                marginBottom: '32px',
                opacity: 0.95,
                fontWeight: 400,
                lineHeight: 1.6,
                fontSize: '1.25rem'
              }}
            >
              Protecther is an e-learning platform dedicated to providing comprehensive EHS training with 
              the knowledge and skills needed to succeed in today's safety-conscious workplace.
            </Typography>
            
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              style={{
                padding: '16px 48px',
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: '25px',
                backgroundColor: '#1976d2'
              }}
            >
              Login
            </Button>
          </div>
        </Container>
      </div>

      {/* Why Choose Section */}
      <div style={{ padding: '96px 0', backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <Typography
              variant="h3"
              component="h2"
              style={{
                fontWeight: 700,
                marginBottom: '24px',
                color: '#333'
              }}
            >
              Why Choose Protecther?
            </Typography>
            <Typography
              variant="h6"
              style={{ 
                fontWeight: 400, 
                maxWidth: '600px', 
                margin: '0 auto',
                color: '#666'
              }}
            >
              Our platform is designed with safety professionals in mind, offering a supportive and engaging learning environment.
            </Typography>
          </div>

          {/* Feature Cards - Simple CSS Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '32px',
            '@media (min-width: 960px)': {
              gridTemplateColumns: 'repeat(3, 1fr)'
            }
          }}>
            {/* Card 1 */}
            <Paper 
              elevation={1}
              style={{
                height: '320px',
                padding: '32px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                backgroundColor: '#fafafa',
                border: '1px solid #e0e0e0'
              }}
            >
              <div style={{ marginBottom: '24px', height: '60px', display: 'flex', alignItems: 'center' }}>
                <SchoolIcon style={{ fontSize: '48px', color: '#1976d2' }} />
              </div>
              <Typography variant="h6" style={{ fontWeight: 700, marginBottom: '16px', color: '#333', minHeight: '32px' }}>
                Expert-Led Courses
              </Typography>
              <Typography variant="body2" style={{ lineHeight: 1.6, color: '#666', textAlign: 'center' }}>
                Learn from industry-leading experts who are passionate about workplace safety and environmental health.
              </Typography>
            </Paper>

            {/* Card 2 */}
            <Paper 
              elevation={1}
              style={{
                height: '320px',
                padding: '32px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                backgroundColor: '#fafafa',
                border: '1px solid #e0e0e0'
              }}
            >
              <div style={{ marginBottom: '24px', height: '60px', display: 'flex', alignItems: 'center' }}>
                <CommunityIcon style={{ fontSize: '48px', color: '#1976d2' }} />
              </div>
              <Typography variant="h6" style={{ fontWeight: 700, marginBottom: '16px', color: '#333', minHeight: '32px' }}>
                Community Support
              </Typography>
              <Typography variant="body2" style={{ lineHeight: 1.6, color: '#666', textAlign: 'center' }}>
                Connect with a community of safety professionals for support and collaboration.
              </Typography>
            </Paper>

            {/* Card 3 */}
            <Paper 
              elevation={1}
              style={{
                height: '320px',
                padding: '32px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                backgroundColor: '#fafafa',
                border: '1px solid #e0e0e0'
              }}
            >
              <div style={{ marginBottom: '24px', height: '60px', display: 'flex', alignItems: 'center' }}>
                <ShieldIcon style={{ fontSize: '48px', color: '#1976d2' }} />
              </div>
              <Typography variant="h6" style={{ fontWeight: 700, marginBottom: '16px', color: '#333', minHeight: '32px' }}>
                Safe and Secure
              </Typography>
              <Typography variant="body2" style={{ lineHeight: 1.6, color: '#666', textAlign: 'center' }}>
                Our platform prioritizes your safety and privacy, ensuring a secure learning experience.
              </Typography>
            </Paper>
          </div>
        </Container>
      </div>

      {/* Courses Section */}
      <div style={{ backgroundColor: '#fafafa', padding: '96px 0' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            component="h2"
            style={{
              fontWeight: 700,
              marginBottom: '48px',
              color: '#333',
              textAlign: 'center'
            }}
          >
            Explore Our Courses
          </Typography>

          {/* Course Cards - Simple CSS Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '32px',
            '@media (min-width: 960px)': {
              gridTemplateColumns: 'repeat(3, 1fr)'
            }
          }}>
            {/* Course Card 1 */}
            <Paper 
              elevation={2}
              style={{
                height: '320px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '160px',
                backgroundColor: '#f5f5f5'
              }}>
                <FireIcon style={{ fontSize: '56px', color: '#f44336' }} />
              </div>
              <div style={{ 
                padding: '24px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                flex: 1
              }}>
                <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '12px', color: '#333', minHeight: '32px' }}>
                  Fire Safety
                </Typography>
                <Typography variant="body2" style={{ color: '#666', lineHeight: 1.6 }}>
                  Learn essential fire safety techniques to protect yourself and others.
                </Typography>
              </div>
            </Paper>

            {/* Course Card 2 */}
            <Paper 
              elevation={2}
              style={{
                height: '320px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '160px',
                backgroundColor: '#f5f5f5'
              }}>
                <FirstAidIcon style={{ fontSize: '56px', color: '#4caf50' }} />
              </div>
              <div style={{ 
                padding: '24px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                flex: 1
              }}>
                <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '12px', color: '#333', minHeight: '32px' }}>
                  First Aid
                </Typography>
                <Typography variant="body2" style={{ color: '#666', lineHeight: 1.6 }}>
                  Gain life-saving skills with our comprehensive first aid course.
                </Typography>
              </div>
            </Paper>

            {/* Course Card 3 */}
            <Paper 
              elevation={2}
              style={{
                height: '320px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '160px',
                backgroundColor: '#f5f5f5'
              }}>
                <CyberIcon style={{ fontSize: '56px', color: '#2196f3' }} />
              </div>
              <div style={{ 
                padding: '24px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                flex: 1
              }}>
                <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '12px', color: '#333', minHeight: '32px' }}>
                  Cybersecurity Basics
                </Typography>
                <Typography variant="body2" style={{ color: '#666', lineHeight: 1.6 }}>
                  Understand the fundamentals of cybersecurity to safeguard your digital life.
                </Typography>
              </div>
            </Paper>
          </div>
        </Container>
      </div>

      {/* Think Section - Feedback/Complaints/Ideas */}
      <div style={{ backgroundColor: 'white', padding: '96px 0' }}>
        <Container maxWidth="lg">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <LightbulbIcon style={{ fontSize: '64px', color: '#1976d2' }} />
            </div>
            <Typography
              variant="h3"
              component="h2"
              style={{
                fontWeight: 700,
                marginBottom: '24px',
                color: '#333'
              }}
            >
              Share Your Thoughts
            </Typography>
            <Typography
              variant="h6"
              style={{ 
                fontWeight: 400, 
                maxWidth: '600px', 
                margin: '0 auto',
                color: '#666'
              }}
            >
              We value your feedback! Share your ideas, suggestions, or concerns to help us improve our platform.
            </Typography>
          </div>
          
          <ThinkForm isPublic={true} isAuthenticated={false} />
        </Container>
      </div>

      {/* Call to Action Section */}
      <div style={{ backgroundColor: '#1976d2', color: 'white', padding: '96px 0' }}>
        <Container maxWidth="lg">
          <div style={{ textAlign: 'center' }}>
            <Typography variant="h4" style={{ fontWeight: 700, marginBottom: '24px' }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" style={{ opacity: 0.9, fontWeight: 400, marginBottom: '32px' }}>
              Join our platform today and transform your organization's safety training approach.
            </Typography>
            
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              style={{
                backgroundColor: 'white',
                color: '#1976d2',
                padding: '16px 48px',
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: '25px'
              }}
            >
              Login
            </Button>
          </div>
        </Container>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#212121', color: 'white', padding: '64px 0' }}>
        <Container maxWidth="lg">
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <a href="#" style={{ color: '#bdbdbd', textDecoration: 'none', fontSize: '1rem' }}>
                Privacy Policy
              </a>
              <a href="#" style={{ color: '#bdbdbd', textDecoration: 'none', fontSize: '1rem' }}>
                Terms of Service
              </a>
              <a href="#" style={{ color: '#bdbdbd', textDecoration: 'none', fontSize: '1rem' }}>
                Contact Us
              </a>
            </div>
            
            <div style={{ borderTop: '1px solid #424242', paddingTop: '32px' }}>
              <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '8px' }}>
                Protecther E-Learning Platform
              </Typography>
              <Typography variant="body1" style={{ color: '#bdbdbd' }}>
                © {new Date().getFullYear()} Protecther. Professional safety training platform.
              </Typography>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default Landing;