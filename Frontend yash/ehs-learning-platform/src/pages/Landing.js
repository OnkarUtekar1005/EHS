// src/pages/Landing.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Rating
} from '@mui/material';
import {
  Login as LoginIcon,
  LocalFireDepartment as FireIcon,
  HealthAndSafety as SafetyIcon,
  Verified as VerifiedIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  EmojiEvents as CertificateIcon,
  Lightbulb as LightbulbIcon,
  Engineering as EngineeringIcon,
  ElectricalServices as ElectricalIcon,
  Science as ChemicalIcon,
  Warning as EmergencyIcon,
  Shield as ShieldIcon,
  PlayCircle as PlayIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { publicService } from '../services/api';
import ThinkForm from '../components/think/ThinkForm';
import CourseEnquiryModal from '../components/CourseEnquiryModal';

// Hero Section Images
import FireDrillImg from '../images/coursel hero section images/Fire drill.png';
import FirstAidImg from '../images/coursel hero section images/First Aid Stretcher Drill.png';
import DrillImg from '../images/coursel hero section images/drile.png';
import GraduationImg from '../images/coursel hero section images/graduation.png';
import HarnessDrillImg from '../images/coursel hero section images/harness drill.png';

// Company Partner Logos
import TataLogo from '../images/Company trusted partner/tata_progects-removebg-preview.png';
import AdaniLogo from '../images/Company trusted partner/Adani.png';
import LTLogo from '../images/Company trusted partner/L&T.png';
import GodrejLogo from '../images/Company trusted partner/godrej.png';
import ShapoorjiLogo from '../images/Company trusted partner/Shapoorji Pallonji.png';
import AFCONSLogo from '../images/Company trusted partner/AFCONS.png';
import NCCLogo from '../images/Company trusted partner/NCC.png';

// Custom hook for scroll animation
const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return [ref, isVisible];
};

// Animated Section Component
const AnimatedSection = ({ children, delay = 0, direction = 'up' }) => {
  const [ref, isVisible] = useScrollAnimation();

  const getTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(40px)';
      case 'down': return 'translateY(-40px)';
      case 'left': return 'translateX(40px)';
      case 'right': return 'translateX(-40px)';
      default: return 'translateY(40px)';
    }
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0)' : getTransform(),
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

const Landing = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [courses, setCourses] = useState([]);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Handle opening course enquiry modal
  const handleOpenEnquiry = (course = null) => {
    setSelectedCourse(course);
    setEnquiryModalOpen(true);
  };

  const handleCloseEnquiry = () => {
    setEnquiryModalOpen(false);
    setSelectedCourse(null);
  };

  // Trigger hero animation on mount
  useEffect(() => {
    setTimeout(() => setHeroLoaded(true), 100);
  }, []);

  // Hero carousel images
  const heroImages = [
    {
      url: FireDrillImg,
      alt: 'Fire drill training session'
    },
    {
      url: FirstAidImg,
      alt: 'First aid stretcher drill'
    },
    {
      url: DrillImg,
      alt: 'Safety drill training'
    },
    {
      url: GraduationImg,
      alt: 'EHS training graduation'
    },
    {
      url: HarnessDrillImg,
      alt: 'Harness safety drill'
    }
  ];

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesResponse = await publicService.getPublishedCourses(10);
        if (coursesResponse?.data?.courses) {
          setCourses(coursesResponse.data.courses);
        } else if (Array.isArray(coursesResponse?.data)) {
          setCourses(coursesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchData();
  }, []);

  // Styles
  const styles = {
    section: {
      padding: '80px 0',
    },
    sectionAlt: {
      padding: '80px 0',
      backgroundColor: '#f8fafc',
    },
    sectionTitle: {
      fontWeight: 700,
      marginBottom: '16px',
      color: '#1e293b',
      textAlign: 'center',
    },
    sectionSubtitle: {
      fontWeight: 400,
      maxWidth: '600px',
      margin: '0 auto 48px',
      color: '#64748b',
      textAlign: 'center',
    },
    card: {
      padding: '32px',
      borderRadius: '12px',
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      height: '100%',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    primaryButton: {
      padding: '14px 32px',
      fontSize: '1rem',
      fontWeight: 600,
      borderRadius: '8px',
      backgroundColor: '#1976d2',
      textTransform: 'none',
    },
    secondaryButton: {
      padding: '14px 32px',
      fontSize: '1rem',
      fontWeight: 600,
      borderRadius: '8px',
      backgroundColor: 'white',
      color: '#1976d2',
      border: '2px solid #1976d2',
      textTransform: 'none',
    },
  };

  // Company logos data
  const companies = [
    { name: 'Tata Projects', logo: TataLogo },
    { name: 'Adani', logo: AdaniLogo },
    { name: 'L&T', logo: LTLogo },
    { name: 'Godrej', logo: GodrejLogo },
    { name: 'Shapoorji Pallonji', logo: ShapoorjiLogo },
    { name: 'AFCONS', logo: AFCONSLogo },
    { name: 'NCC', logo: NCCLogo },
  ];

  // Why choose features
  const features = [
    {
      icon: <VerifiedIcon style={{ fontSize: 48, color: '#1976d2' }} />,
      title: 'Certified EHS Courses',
      description: 'Industry-recognized certifications that meet global safety standards and compliance requirements.'
    },
    {
      icon: <PlayIcon style={{ fontSize: 48, color: '#1976d2' }} />,
      title: 'Engaging Video Content',
      description: 'Interactive video lessons and simulations that make learning engaging and memorable.'
    },
    {
      icon: <ShieldIcon style={{ fontSize: 48, color: '#1976d2' }} />,
      title: 'Compliance-Ready Modules',
      description: 'Pre-built modules designed to meet regulatory requirements across industries.'
    },
    {
      icon: <AssessmentIcon style={{ fontSize: 48, color: '#1976d2' }} />,
      title: 'Track Progress & Reports',
      description: 'Comprehensive analytics and reporting to monitor training completion and performance.'
    }
  ];

  // Color palette for course cards
  const courseColors = ['#1976d2', '#ef4444', '#f59e0b', '#dc2626', '#8b5cf6', '#0ea5e9', '#22c55e', '#6366f1'];

  // Get icon based on course icon name or index
  const getCourseIcon = (iconName, index) => {
    const color = courseColors[index % courseColors.length];
    const iconStyle = { fontSize: 36, color };

    // Map icon names to components
    const iconMap = {
      'safety': <SafetyIcon style={iconStyle} />,
      'fire': <FireIcon style={iconStyle} />,
      'engineering': <EngineeringIcon style={iconStyle} />,
      'emergency': <EmergencyIcon style={iconStyle} />,
      'chemical': <ChemicalIcon style={iconStyle} />,
      'electrical': <ElectricalIcon style={iconStyle} />,
      'shield': <ShieldIcon style={iconStyle} />,
      'school': <SchoolIcon style={iconStyle} />,
      'assessment': <AssessmentIcon style={iconStyle} />,
      'verified': <VerifiedIcon style={iconStyle} />,
    };

    // Try to match icon name, fallback to rotating icons
    if (iconName && iconMap[iconName.toLowerCase()]) {
      return iconMap[iconName.toLowerCase()];
    }

    // Default rotating icons based on index
    const defaultIcons = [SafetyIcon, FireIcon, EngineeringIcon, EmergencyIcon, ChemicalIcon, ElectricalIcon, ShieldIcon, SchoolIcon];
    const IconComponent = defaultIcons[index % defaultIcons.length];
    return <IconComponent style={iconStyle} />;
  };

  // Format time limit to readable duration
  const formatDuration = (timeLimit) => {
    if (!timeLimit) return 'Self-paced';
    if (timeLimit >= 60) {
      const hours = Math.floor(timeLimit / 60);
      const mins = timeLimit % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${timeLimit} min`;
  };

  // How it works steps
  const steps = [
    { number: '1', icon: <SchoolIcon style={{ fontSize: 48, color: 'white' }} />, title: 'Select Course', description: 'Browse our catalog and choose the training that fits your needs.' },
    { number: '2', icon: <QuizIcon style={{ fontSize: 48, color: 'white' }} />, title: 'Learn & Assess', description: 'Complete interactive modules and take assessments to test your knowledge.' },
    { number: '3', icon: <CertificateIcon style={{ fontSize: 48, color: 'white' }} />, title: 'Get Certified', description: 'Download your certificate upon successful completion.' },
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Safety Manager, Manufacturing',
      rating: 5,
      text: 'Protecther has reduced our workplace incidents by 40%. The training modules are comprehensive and easy to implement across our teams.',
      avatar: 'RK'
    },
    {
      name: 'Priya Sharma',
      role: 'HR Director, IT Services',
      rating: 5,
      text: 'Our employees love the interactive content. Completion rates went from 60% to 95% after switching to Protecther.',
      avatar: 'PS'
    },
    {
      name: 'Amit Patel',
      role: 'Operations Head, Logistics',
      rating: 4,
      text: 'The compliance reporting feature saves us hours every month. Highly recommended for any organization serious about safety.',
      avatar: 'AP'
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Navigation Header - Sticky */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Container maxWidth="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box
                component="img"
                src="/logo-image.jpg"
                alt="Protecther Logo"
                style={{
                  width: '100px',
                  height: '50px',
                  objectFit: 'contain',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                startIcon={<LoginIcon />}
                style={{
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  backgroundColor: '#1976d2',
                  textTransform: 'none'
                }}
              >
                Login
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Global Animation Styles */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInRight {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .hover-lift:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          }
          .btn-hover {
            transition: all 0.3s ease;
          }
          .btn-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          }
        `}
      </style>

      {/* Section 1: Hero */}
      <div
        style={{
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #1976d2 50%, #42a5f5 100%)',
          color: 'white',
          padding: '60px 0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5
        }} />

        <Container maxWidth="lg" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 500px', minWidth: '300px' }}>
              <Typography
                variant="h2"
                component="h1"
                style={{
                  fontWeight: 800,
                  marginBottom: '24px',
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  opacity: heroLoaded ? 1 : 0,
                  transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
                }}
              >
                Master Workplace Safety With Certified EHS Training
              </Typography>

              <Typography
                variant="h6"
                style={{
                  marginBottom: '40px',
                  opacity: heroLoaded ? 0.95 : 0,
                  fontWeight: 400,
                  lineHeight: 1.7,
                  fontSize: '1.2rem',
                  maxWidth: '540px',
                  transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s'
                }}
              >
                Protecther gives employees and employers the modern training needed to stay compliant and build a safer, smarter workplace.
              </Typography>

              <div style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                opacity: heroLoaded ? 1 : 0,
                transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.8s ease-out 0.4s, transform 0.8s ease-out 0.4s'
              }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  size="large"
                  className="btn-hover"
                  style={{
                    padding: '16px 40px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#1976d2',
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                  }}
                >
                  Start Learning
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  className="btn-hover"
                  style={{
                    padding: '16px 40px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    borderColor: 'white',
                    borderWidth: '2px',
                    color: 'white',
                    textTransform: 'none'
                  }}
                >
                  View Courses
                </Button>
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '40px',
                marginTop: '48px',
                flexWrap: 'wrap',
                opacity: heroLoaded ? 1 : 0,
                transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.8s ease-out 0.6s, transform 0.8s ease-out 0.6s'
              }}>
                <div>
                  <Typography style={{ fontSize: '2.5rem', fontWeight: 700 }}>50+</Typography>
                  <Typography style={{ opacity: 0.8 }}>Courses Available</Typography>
                </div>
                <div>
                  <Typography style={{ fontSize: '2.5rem', fontWeight: 700 }}>10K+</Typography>
                  <Typography style={{ opacity: 0.8 }}>Trained Employees</Typography>
                </div>
                <div>
                  <Typography style={{ fontSize: '2.5rem', fontWeight: 700 }}>98%</Typography>
                  <Typography style={{ opacity: 0.8 }}>Satisfaction Rate</Typography>
                </div>
              </div>
            </div>

            {/* Image Carousel */}
            <div style={{
              flex: '1 1 400px',
              minWidth: '300px',
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? 'translateX(0)' : 'translateX(30px)',
              transition: 'opacity 0.8s ease-out 0.3s, transform 0.8s ease-out 0.3s'
            }}>
              <div style={{
                width: '100%',
                maxWidth: '500px',
                position: 'relative'
              }}>
                {/* Main carousel container */}
                <div style={{
                  aspectRatio: '4/3',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  position: 'relative',
                  border: '3px solid rgba(255,255,255,0.2)'
                }}>
                  {heroImages.map((image, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: currentImageIndex === index ? 1 : 0,
                        transition: 'opacity 0.8s ease-in-out',
                        backgroundImage: `url('${image.url}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  ))}
                </div>

                {/* Carousel indicators */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '20px'
                }}>
                  {heroImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      style={{
                        width: currentImageIndex === index ? '32px' : '10px',
                        height: '10px',
                        borderRadius: '5px',
                        backgroundColor: currentImageIndex === index ? 'white' : 'rgba(255,255,255,0.4)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        padding: 0
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Badge */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-10px',
                backgroundColor: '#22c55e',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '30px',
                fontWeight: 600,
                fontSize: '0.9rem',
                boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'float 3s ease-in-out infinite',
                zIndex: 10
              }}>
                <VerifiedIcon style={{ fontSize: 20 }} />
                ISO Certified
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Section 2: Trusted by Leading Companies - Sliding Carousel */}
      <div style={{
        padding: '60px 0',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Typography
              variant="body1"
              style={{
                textAlign: 'center',
                color: '#64748b',
                marginBottom: '32px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontSize: '0.875rem'
              }}
            >
              Trusted by Leading Companies
            </Typography>
          </AnimatedSection>
        </Container>

        {/* Logo Carousel - Infinite Scroll */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          padding: '10px 0'
        }}>
          {/* Left gradient mask */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '100px',
            background: 'linear-gradient(to right, #f8fafc, transparent)',
            zIndex: 2,
            pointerEvents: 'none'
          }} />
          {/* Right gradient mask */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '100px',
            background: 'linear-gradient(to left, #f8fafc, transparent)',
            zIndex: 2,
            pointerEvents: 'none'
          }} />

          <style>{`
            @keyframes scrollLeft {
              0% { transform: translateX(0); }
              100% { transform: translateX(-1260px); }
            }
            .logo-scroll-container {
              display: flex;
              width: max-content;
              animation: scrollLeft 20s linear infinite;
            }
            .logo-scroll-container:hover {
              animation-play-state: paused;
            }
            .logo-scroll-item {
              flex: 0 0 180px;
              height: 70px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo-scroll-item img {
              height: 45px;
              max-width: 140px;
              object-fit: contain;
              transition: transform 0.3s;
            }
            .logo-scroll-item:hover img {
              transform: scale(1.1);
            }
          `}</style>

          {/* 7 logos × 180px = 1260px per set. Animation scrolls exactly 1260px. */}
          <div className="logo-scroll-container">
            {[1, 2, 3, 4].map(setNum =>
              companies.map((company, index) => (
                <div key={`${setNum}-${index}`} className="logo-scroll-item">
                  <img src={company.logo} alt={company.name} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Why Choose Protecther? */}
      <div style={styles.section}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Typography variant="h3" style={styles.sectionTitle}>
              Why Choose Protecther?
            </Typography>
            <Typography variant="h6" style={styles.sectionSubtitle}>
              Our platform is designed with safety professionals in mind, offering cutting-edge tools and content.
            </Typography>
          </AnimatedSection>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {features.map((feature, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <Paper
                  elevation={0}
                  className="hover-lift"
                  style={{
                    ...styles.card,
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    marginBottom: '20px',
                    transition: 'transform 0.3s ease'
                  }}>
                    {feature.icon}
                  </div>
                  <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '12px', color: '#1e293b' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" style={{ color: '#64748b', lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </AnimatedSection>
            ))}
          </div>
        </Container>
      </div>

      {/* Section 4: Explore Our EHS Courses */}
      <div style={{
        padding: '80px 0 60px',
        backgroundColor: '#F7F7F7',
        minHeight: '600px'
      }}>
        <style>
          {`
            @keyframes courseMarquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .course-marquee-track {
              display: flex;
              animation: courseMarquee ${Math.max(courses.length * 4, 30)}s linear infinite;
              width: fit-content;
              gap: 28px;
              padding: 20px 0;
            }
            .course-marquee-track:hover {
              animation-play-state: paused;
            }
            .course-card-premium {
              transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .course-card-premium:hover {
              transform: translateY(-8px) !important;
              box-shadow: 0 20px 40px rgba(0,0,0,0.12), 0 0 0 2px rgba(0,123,255,0.15) !important;
            }
            .course-card-premium:hover .course-image {
              transform: scale(1.05);
            }
            .course-card-premium:hover .cta-arrow {
              transform: translateX(5px);
            }
            .course-card-premium:hover .cta-text {
              text-decoration: underline;
            }
            .course-image {
              transition: transform 0.4s ease;
            }
            .cta-arrow {
              transition: transform 0.3s ease;
              display: inline-block;
            }
            .cta-text {
              transition: text-decoration 0.3s ease;
            }
            .browse-all-btn {
              transition: all 0.3s ease;
            }
            .browse-all-btn:hover {
              transform: scale(1.03);
              box-shadow: 0 8px 25px rgba(0,123,255,0.35);
              padding: 16px 40px !important;
            }
            .section-subtitle-animate {
              animation: fadeInUpSubtitle 0.6s ease forwards;
              animation-delay: 150ms;
              opacity: 0;
            }
            @keyframes fadeInUpSubtitle {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>

        <Container maxWidth="lg">
          {/* Section Header */}
          <AnimatedSection>
            <Typography variant="h2" style={{
              fontSize: 'clamp(38px, 5vw, 44px)',
              fontWeight: 700,
              color: '#1C1C1C',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              Explore Our EHS Courses
            </Typography>
          </AnimatedSection>
          <Typography className="section-subtitle-animate" style={{
            fontSize: 'clamp(18px, 2.5vw, 22px)',
            fontWeight: 400,
            color: '#6F6F6F',
            textAlign: 'center',
            maxWidth: '650px',
            margin: '0 auto 48px',
            lineHeight: 1.6
          }}>
            Comprehensive safety training to empower a secure workplace.
          </Typography>
        </Container>

        {/* Marquee Container */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Left gradient mask */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '100px',
            background: 'linear-gradient(to right, #F7F7F7, transparent)',
            zIndex: 2,
            pointerEvents: 'none'
          }} />
          {/* Right gradient mask */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '100px',
            background: 'linear-gradient(to left, #F7F7F7, transparent)',
            zIndex: 2,
            pointerEvents: 'none'
          }} />

          {/* Course Cards Marquee */}
          {courses.length > 0 ? (
            <div className="course-marquee-track">
              {/* Duplicate courses for seamless loop - show up to 10 */}
              {[...courses.slice(0, 10), ...courses.slice(0, 10)].map((course, index) => {
                const originalIndex = index % Math.min(courses.length, 10);
                const illustrations = [
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
                  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
                  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
                  'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)'
                ];

                return (
                  <Paper
                    key={`${course.id || index}-${index}`}
                    elevation={0}
                    onClick={() => handleOpenEnquiry(course)}
                    className="course-card-premium"
                    style={{
                      width: '320px',
                      minWidth: '320px',
                      borderRadius: '22px',
                      backgroundColor: 'white',
                      textDecoration: 'none',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {/* Course Image/Illustration Area */}
                    <div style={{
                      height: '180px',
                      background: illustrations[originalIndex % illustrations.length],
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '22px 22px 0 0'
                    }}>
                      <div
                        className="course-image"
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        {/* Course Icon */}
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '20px',
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          backdropFilter: 'blur(10px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {React.cloneElement(getCourseIcon(course.icon, originalIndex), {
                            style: { fontSize: '40px', color: 'white' }
                          })}
                        </div>
                      </div>
                      {/* Overlay gradient for text readability */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)'
                      }} />
                    </div>

                    {/* Card Content */}
                    <div style={{
                      padding: '22px 24px 24px',
                      backgroundColor: 'white',
                      borderRadius: '0 0 22px 22px'
                    }}>
                      {/* Course Title */}
                      <Typography style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#1C1C1C',
                        lineHeight: 1.4,
                        marginBottom: '10px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '56px'
                      }}>
                        {course.title}
                      </Typography>

                      {/* Short Description */}
                      <Typography style={{
                        fontSize: '14px',
                        color: '#6F6F6F',
                        lineHeight: '21px',
                        marginBottom: '16px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '63px'
                      }}>
                        {course.description || `Learn essential ${course.title?.toLowerCase()} skills and best practices for workplace safety.`}
                      </Typography>

                      {/* Tags/Badges */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '18px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#007BFF',
                          backgroundColor: 'rgba(0,123,255,0.1)',
                          padding: '5px 12px',
                          borderRadius: '20px'
                        }}>
                          {course.componentCount || 0} Modules
                        </span>
                        {course.timeLimit && (
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#6F6F6F',
                            backgroundColor: '#F0F0F0',
                            padding: '5px 12px',
                            borderRadius: '20px'
                          }}>
                            {formatDuration(course.timeLimit)}
                          </span>
                        )}
                      </div>

                      {/* CTA Link */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span className="cta-text" style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#007BFF'
                        }}>
                          Enquiry
                        </span>
                        <span className="cta-arrow" style={{
                          fontSize: '15px',
                          color: '#007BFF'
                        }}>
                          →
                        </span>
                      </div>
                    </div>
                  </Paper>
                );
              })}
            </div>
          ) : (
            <Container maxWidth="lg">
              <Typography style={{ textAlign: 'center', color: '#6F6F6F', padding: '40px 0' }}>
                Courses coming soon...
              </Typography>
            </Container>
          )}
        </div>

        {/* Browse All Courses Button */}
        {courses.length > 0 && (
          <Container maxWidth="lg">
            <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <Button
                onClick={() => handleOpenEnquiry(null)}
                variant="contained"
                className="browse-all-btn"
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  padding: '14px 36px',
                  borderRadius: '50px',
                  backgroundColor: '#007BFF',
                  color: 'white',
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(0,123,255,0.3)'
                }}
              >
                Browse All Courses →
              </Button>
            </div>
          </Container>
        )}
      </div>

      {/* Section 5: How It Works */}
      <div style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, #1976d2 0%, #1e3a5f 100%)',
        color: 'white'
      }}>
        <style>
          {`
            .how-it-works-container {
              display: flex;
              justify-content: center;
              align-items: flex-start;
              gap: 0;
              margin-top: 48px;
              position: relative;
            }
            .how-it-works-step {
              flex: 1;
              max-width: 320px;
              text-align: center;
              position: relative;
              padding: 0 20px;
            }
            .how-it-works-step.has-connector::after {
              content: '';
              position: absolute;
              top: 60px;
              left: calc(50% + 60px);
              right: calc(-50% + 60px);
              height: 3px;
              background: rgba(255,255,255,0.3);
              z-index: 1;
            }
            .step-icon-container {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              background-color: rgba(255,255,255,0.15);
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
              position: relative;
              border: 3px solid rgba(255,255,255,0.3);
              transition: transform 0.3s ease, background-color 0.3s ease;
              z-index: 2;
            }
            .step-icon-container:hover {
              transform: scale(1.05);
              background-color: rgba(255,255,255,0.25);
            }
            @media (max-width: 900px) {
              .how-it-works-container {
                flex-direction: column;
                align-items: center;
                gap: 48px;
              }
              .how-it-works-step {
                max-width: 100%;
              }
              .how-it-works-step.has-connector::after {
                display: none;
              }
              .how-it-works-step.has-connector::before {
                content: '';
                position: absolute;
                bottom: -24px;
                left: 50%;
                transform: translateX(-50%);
                width: 3px;
                height: 48px;
                background: rgba(255,255,255,0.3);
                z-index: 1;
              }
            }
          `}
        </style>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Typography variant="h3" style={{ ...styles.sectionTitle, color: 'white' }}>
              How It Works
            </Typography>
            <Typography variant="h6" style={{ ...styles.sectionSubtitle, color: 'rgba(255,255,255,0.8)' }}>
              Get certified in three simple steps.
            </Typography>
          </AnimatedSection>

          <div className="how-it-works-container">
            {steps.map((step, index) => (
              <div key={index} className={`how-it-works-step ${index < steps.length - 1 ? 'has-connector' : ''}`}>
                <AnimatedSection delay={index * 0.2}>
                  <div className="step-icon-container">
                    {step.icon}
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      color: '#1976d2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      {step.number}
                    </div>
                  </div>
                  <Typography variant="h5" style={{ fontWeight: 600, marginBottom: '12px' }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body1" style={{ opacity: 0.85, maxWidth: '280px', margin: '0 auto', lineHeight: 1.6 }}>
                    {step.description}
                  </Typography>
                </AnimatedSection>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Section 6: Testimonials */}
      <div style={styles.section}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Typography variant="h3" style={styles.sectionTitle}>
              Real Results From Real Users
            </Typography>
            <Typography variant="h6" style={styles.sectionSubtitle}>
              See what safety professionals are saying about Protecther.
            </Typography>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '48px',
              gap: '8px'
            }}>
              <Rating value={4.8} precision={0.1} readOnly size="large" />
              <Typography variant="h6" style={{ fontWeight: 600, color: '#1e293b' }}>
                4.8/5
              </Typography>
              <Typography variant="body2" style={{ color: '#64748b' }}>
                (Based on 500+ reviews)
              </Typography>
            </div>
          </AnimatedSection>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={index} delay={index * 0.15}>
                <Paper
                  elevation={0}
                  className="hover-lift"
                  style={{
                    ...styles.card,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      transition: 'transform 0.3s ease'
                    }}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#1e293b' }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" style={{ color: '#64748b' }}>
                        {testimonial.role}
                      </Typography>
                    </div>
                  </div>
                  <Rating value={testimonial.rating} readOnly size="small" style={{ marginBottom: '12px' }} />
                  <Typography variant="body1" style={{ color: '#475569', lineHeight: 1.7, fontStyle: 'italic' }}>
                    "{testimonial.text}"
                  </Typography>
                </Paper>
              </AnimatedSection>
            ))}
          </div>
        </Container>
      </div>

      {/* Think Section - Feedback/Complaints/Ideas */}
      <div style={styles.sectionAlt}>
        <Container maxWidth="md">
          <AnimatedSection>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <div style={{
                  animation: 'float 3s ease-in-out infinite'
                }}>
                  <LightbulbIcon style={{ fontSize: '56px', color: '#1976d2' }} />
                </div>
              </div>
              <Typography variant="h3" style={styles.sectionTitle}>
                Share Your Thoughts
              </Typography>
              <Typography variant="h6" style={styles.sectionSubtitle}>
                We value your feedback! Share your ideas, suggestions, or concerns to help us improve.
              </Typography>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '600px' }}>
                <ThinkForm isPublic={true} isAuthenticated={false} />
              </div>
            </div>
          </AnimatedSection>
        </Container>
      </div>

      {/* Call to Action Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1976d2 100%)',
        color: 'white',
        padding: '96px 0'
      }}>
        <Container maxWidth="md">
          <AnimatedSection>
            <div style={{ textAlign: 'center' }}>
              <Typography variant="h3" style={{ fontWeight: 700, marginBottom: '24px' }}>
                Ready to Transform Your Safety Training?
              </Typography>
              <Typography variant="h6" style={{ opacity: 0.9, fontWeight: 400, marginBottom: '40px', lineHeight: 1.7 }}>
                Join thousands of organizations that trust Protecther for their EHS training needs.
              </Typography>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  size="large"
                  className="btn-hover"
                  style={{
                    backgroundColor: 'white',
                    color: '#1976d2',
                    padding: '16px 48px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    textTransform: 'none'
                  }}
                >
                  Start Free Trial
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  className="btn-hover"
                  style={{
                    borderColor: 'white',
                    borderWidth: '2px',
                    color: 'white',
                    padding: '16px 48px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    textTransform: 'none'
                  }}
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </Container>
      </div>

      {/* Section 9: Footer */}
      <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '80px 0 40px' }}>
        <Container maxWidth="lg">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '48px',
            marginBottom: '64px'
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Typography variant="h5" style={{ fontWeight: 700 }}>
                  Protecther
                </Typography>
              </div>
              <Typography variant="body2" style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '24px' }}>
                Professional EHS training platform for modern organizations.
              </Typography>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href="#" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>
                  <LinkedInIcon />
                </a>
                <a href="#" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>
                  <TwitterIcon />
                </a>
                <a href="#" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>
                  <FacebookIcon />
                </a>
                <a href="#" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>
                  <YouTubeIcon />
                </a>
              </div>
            </div>

            {/* Courses */}
            <div>
              <Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: '20px' }}>
                Courses
              </Typography>
              {['Safety Induction', 'Fire Safety', 'First Aid', 'PPE Training', 'Emergency Response'].map((item, index) => (
                <a
                  key={index}
                  href="#"
                  style={{
                    display: 'block',
                    color: '#94a3b8',
                    textDecoration: 'none',
                    marginBottom: '12px',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                  }}
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Company */}
            <div>
              <Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: '20px' }}>
                Company
              </Typography>
              {['About Us', 'Blog', 'Careers', 'Press', 'Partners'].map((item, index) => (
                <a
                  key={index}
                  href="#"
                  style={{
                    display: 'block',
                    color: '#94a3b8',
                    textDecoration: 'none',
                    marginBottom: '12px',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                  }}
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Support */}
            <div>
              <Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: '20px' }}>
                Support
              </Typography>
              {[
                { name: 'Help Center', url: '#' },
                { name: 'Contact Us', url: '#' },
                { name: 'Privacy Policy', url: 'https://drive.google.com/uc?export=download&id=1HtIfKesFqJeZHPAoc6yPLIU5WJyeKNph' },
                { name: 'Terms of Service', url: 'https://drive.google.com/uc?export=download&id=1JQzP66h4i8KqWYLwWj09yzuThJxe04XD' },
                { name: 'Cookie Policy', url: '#' }
              ].map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target={item.url !== '#' ? '_blank' : undefined}
                  rel={item.url !== '#' ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'block',
                    color: '#94a3b8',
                    textDecoration: 'none',
                    marginBottom: '12px',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                  }}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid #1e293b',
            paddingTop: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <Typography variant="body2" style={{ color: '#64748b' }}>
              © {new Date().getFullYear()} Protecther. All rights reserved.
            </Typography>
            <div style={{ display: 'flex', gap: '24px' }}>
              <a
                href="https://drive.google.com/uc?export=download&id=1HtIfKesFqJeZHPAoc6yPLIU5WJyeKNph"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Privacy Policy
              </a>
              <a
                href="https://drive.google.com/uc?export=download&id=1JQzP66h4i8KqWYLwWj09yzuThJxe04XD"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Terms of Service
              </a>
              <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>
                Cookies
              </a>
            </div>
          </div>
        </Container>
      </div>

      {/* Course Enquiry Modal */}
      <CourseEnquiryModal
        open={enquiryModalOpen}
        onClose={handleCloseEnquiry}
        selectedCourse={selectedCourse}
      />
    </div>
  );
};

export default Landing;
