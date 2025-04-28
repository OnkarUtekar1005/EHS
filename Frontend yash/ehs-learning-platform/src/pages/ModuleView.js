// src/pages/ModuleView.js

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Box, Button, Stepper, Step, StepLabel,
    StepButton, LinearProgress, Card, CardContent, Divider, Alert,
    CircularProgress, Grid, FormControl, FormControlLabel, Radio, RadioGroup,
    FormLabel, Chip
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon,
    CheckCircle as CheckCircleIcon, PlayArrow as PlayArrowIcon,
    Assignment as AssignmentIcon, Book as BookIcon, Done as DoneIcon,
    Domain as DomainIcon, Timer as TimerIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { moduleService, progressService, assessmentService } from '../services/api'; // Removed learningMaterialService as it's used in the child
import UserLearningContentViewer from '../components/learning/UserLearningContentViewer'; // Ensure path is correct

const LOG_PREFIX = "[ModuleView]";

const ModuleView = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    console.log(`${LOG_PREFIX} Rendering or Re-rendering. ModuleId: ${moduleId}`);

    // Module and Loading States
    const [moduleData, setModuleData] = useState(null); // Will hold the nested module object { id, title, components, ... }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Progress and Navigation States
    const [currentStep, setCurrentStep] = useState(0);
    const [componentProgressMap, setComponentProgressMap] = useState({}); // { [componentId]: { completed: boolean, score?: number } }

    // Active Component States
    const [activeComponent, setActiveComponent] = useState(null);
    const [componentLoading, setComponentLoading] = useState(false);
    const [componentError, setComponentError] = useState(null);

    // Assessment States
    const [assessmentAnswers, setAssessmentAnswers] = useState({});
    const [assessmentComplete, setAssessmentComplete] = useState(false);
    const [assessmentScore, setAssessmentScore] = useState(null);
    const [assessmentFeedback, setAssessmentFeedback] = useState(null);

    // --- Derived State for Overall Progress ---
    const overallProgress = useMemo(() => {
        // Relies on moduleData having the correct structure with .components array
        if (!moduleData?.components || !Array.isArray(moduleData.components) || moduleData.components.length === 0) {
            return 0;
        }
        const completedCount = Object.values(componentProgressMap).filter(p => p.completed).length;
        const totalComponents = moduleData.components.length;
        return totalComponents > 0 ? (completedCount / totalComponents) * 100 : 0;
    }, [moduleData, componentProgressMap]); // Recalculate when moduleData or progress map changes

    // --- Data Fetching (Initial Load) ---
    useEffect(() => {
        console.log(`${LOG_PREFIX} useEffect [moduleId, currentUser] triggered for initial data fetch.`);
        if (!currentUser?.id || !moduleId) {
            console.log(`${LOG_PREFIX} Missing currentUser or moduleId.`);
            if (!loading) setLoading(true); // Ensure loading state if parameters missing
            return;
        }
        console.log(`${LOG_PREFIX} Current User ID: ${currentUser.id}`);

        let isMounted = true;

        const fetchModuleDataAndProgress = async () => {
            console.log(`${LOG_PREFIX} Starting initial data fetch for moduleId: ${moduleId}`);
            // Ensure loading is set at the start of fetch attempt
            setLoading(true);
            setError(null);
            try {
                const [moduleResponse, progressResponse] = await Promise.all([
                    moduleService.getById(moduleId),
                    progressService.getUserModuleProgress(currentUser.id, moduleId)
                ]);

                if (!isMounted) return; // Abort if component unmounted during fetch

                console.log(`${LOG_PREFIX} Raw moduleResponse Status: ${moduleResponse?.status}`, moduleResponse?.data);
                console.log(`${LOG_PREFIX} Raw progressResponse Status: ${progressResponse?.status}`, progressResponse?.data);

                // *** Access the nested 'module' object from the response ***
                const fetchedModuleObject = moduleResponse.data?.module;
                const progressData = progressResponse.data;
                console.log(`${LOG_PREFIX} Extracted module object:`, fetchedModuleObject);
                console.log(`${LOG_PREFIX} Fetched progress data:`, progressData);

                if (!fetchedModuleObject || !fetchedModuleObject.id) {
                     throw new Error("Module data is missing or invalid in the API response.");
                 }

                // Initialize progress map using the components from the nested object
                const initialProgressMap = {};
                if (fetchedModuleObject.components && Array.isArray(fetchedModuleObject.components)) {
                    fetchedModuleObject.components.forEach(comp => {
                        if (!comp || !comp.id) return; // Skip invalid components
                        const progressInfo = progressData.componentProgress?.find(cp => cp.componentId === comp.id);
                        initialProgressMap[comp.id] = {
                            completed: progressInfo?.completed || false,
                            score: progressInfo?.score !== undefined ? progressInfo.score : undefined
                        };
                    });
                    console.log(`${LOG_PREFIX} Initialized componentProgressMap:`, initialProgressMap);
                } else {
                    console.warn(`${LOG_PREFIX} No valid components array found in fetched module object.`);
                }

                // Determine initial step index
                let initialStepIndex = 0;
                 if (progressData.currentComponent?.id && fetchedModuleObject.components) {
                    const idx = fetchedModuleObject.components.findIndex(c => c.id === progressData.currentComponent.id);
                    initialStepIndex = (idx !== -1) ? idx : 0;
                 } else if (progressData.state === 'COMPLETED' && fetchedModuleObject.components?.length > 0) {
                     initialStepIndex = fetchedModuleObject.components.length - 1;
                 }
                 console.log(`${LOG_PREFIX} Determined initialStepIndex: ${initialStepIndex}`);

                // --- Set State ---
                 console.log(`${LOG_PREFIX} Setting componentProgressMap, currentStep, and moduleData states.`);
                setComponentProgressMap(initialProgressMap);
                setCurrentStep(initialStepIndex);
                // Set the nested module object as the main module data state
                setModuleData(fetchedModuleObject);

                // Trigger module start in background if needed
                if (progressData.state === 'NOT_STARTED') {
                     progressService.startModule(moduleId).catch(startError => console.warn(`${LOG_PREFIX} Background startModule call failed:`, startError));
                 }

            } catch (err) {
                console.error(`${LOG_PREFIX} CRITICAL ERROR fetching initial data:`, err);
                 if (!isMounted) return;
                const status = err.response?.status;
                if (status === 401 || status === 403) setError(`Access Denied (${status}).`);
                else setError(err.message || `Failed to load module data (Status: ${status || 'N/A'}).`);
                setModuleData(null); // Clear potentially partial data on error
                setComponentProgressMap({});
            } finally {
                console.log(`${LOG_PREFIX} Fetch attempt finally block.`);
                 if (isMounted) {
                    setLoading(false); // Ensure loading is false only if mounted
                 }
            }
        };

        fetchModuleDataAndProgress();

        return () => { // Cleanup function
            console.log(`${LOG_PREFIX} Unmounting or dependencies changed.`);
            isMounted = false;
        };
    }, [moduleId, currentUser]); // Dependencies for initial fetch

    // --- Load Active Component Content (when step or data changes) ---
    useEffect(() => {
        console.log(`${LOG_PREFIX} useEffect [moduleData, currentStep, componentProgressMap] triggered. Current Step: ${currentStep}`);

        // Guard clauses for valid data and step index
        if (!moduleData?.components || !Array.isArray(moduleData.components)) {
            console.warn(`${LOG_PREFIX} ActiveComponent Effect: moduleData or components array missing/invalid.`);
            setActiveComponent(null);
            return;
        }
        if (currentStep < 0 || currentStep >= moduleData.components.length) {
             console.warn(`${LOG_PREFIX} ActiveComponent Effect: currentStep index ${currentStep} out of bounds.`);
             setActiveComponent(null);
             return;
         }

        const component = moduleData.components[currentStep];
        if (!component || !component.id) {
            console.error(`${LOG_PREFIX} ActiveComponent Effect: Component data invalid at index ${currentStep}:`, component);
            setActiveComponent(null);
            setComponentError('Invalid component data.'); // Set error state
            return;
        }
        console.log(`${LOG_PREFIX} ActiveComponent Effect: Attempting to load component:`, component);

        let isEffectMounted = true;

        const loadComponent = async () => {
            console.log(`${LOG_PREFIX} loadComponent async started for component: ${component.id} (${component.type})`);
            // Reset states for the new component load
             setComponentLoading(true);
             setComponentError(null);
             setActiveComponent(null); // Clear previous component immediately
             setAssessmentComplete(false);
             setAssessmentScore(null);
             setAssessmentFeedback(null);
             setAssessmentAnswers({});
            try {
                const progress = componentProgressMap[component.id];
                console.log(`${LOG_PREFIX} loadComponent: Progress for ${component.id}:`, progress);

                let loadedComponentData = null; // Prepare data before setting state

                if (isAssessment(component.type)) {
                    console.log(`${LOG_PREFIX} loadComponent: Is Assessment.`);
                    if (progress?.completed) {
                        console.log(`${LOG_PREFIX} loadComponent: Assessment already completed. Setting results view.`);
                        loadedComponentData = { ...component, questions: [] }; // Don't need questions if completed
                        setAssessmentComplete(true);
                        setAssessmentScore(progress.score);
                    } else {
                        console.log(`${LOG_PREFIX} loadComponent: Fetching questions for assessment ${component.id}.`);
                        const assessmentResponse = await assessmentService.getQuestions(component.id);
                        if (!isEffectMounted) return; // Check mount after await
                        console.log(`${LOG_PREFIX} loadComponent: Fetched questions for ${component.id}.`);
                        loadedComponentData = { ...component, questions: assessmentResponse.data || [] };
                    }
                } else {
                    console.log(`${LOG_PREFIX} loadComponent: Is Learning type (${component.type}).`);
                    // For learning components, just pass the component data.
                    // UserLearningContentViewer will fetch its specific materials.
                    loadedComponentData = component;
                }

                // Set active component state if still mounted
                if (isEffectMounted) {
                    console.log(`${LOG_PREFIX} loadComponent: Setting activeComponent state.`);
                    setActiveComponent(loadedComponentData);
                }

            } catch (err) {
                console.error(`${LOG_PREFIX} loadComponent: Error loading content for component ${component.id}:`, err);
                if (isEffectMounted) {
                    setComponentError(`Failed to load content for step: ${component.title}.`);
                    setActiveComponent(component); // Show basic info even on error
                }
            } finally {
                console.log(`${LOG_PREFIX} loadComponent: finally block for ${component.id}.`);
                if (isEffectMounted) {
                    setComponentLoading(false);
                }
            }
        };

        loadComponent();

        return () => { // Cleanup for this effect run
             console.log(`${LOG_PREFIX} ActiveComponent Effect cleanup running for step ${currentStep}.`);
            isEffectMounted = false;
        };

    }, [moduleData, currentStep, componentProgressMap]); // Dependencies for reloading component content

    // --- Helper Functions ---
    const isAssessment = (type) => type === 'PRE_ASSESSMENT' || type === 'POST_ASSESSMENT';
    const isComponentCompleted = (componentId) => componentProgressMap[componentId]?.completed || false;

    // Function to update local progress map state
    const updateLocalComponentProgress = (componentId, completed = true, score = undefined) => {
        console.log(`${LOG_PREFIX} updateLocalComponentProgress called for ${componentId}. Completed: ${completed}, Score: ${score}`);
        setComponentProgressMap(prevMap => ({
            ...prevMap,
            [componentId]: {
                ...prevMap[componentId],
                completed: completed,
                ...(score !== undefined && { score: score }) // Conditionally add score
            }
        }));
    };

    // --- Event Handlers ---
    const handleBackToCourses = () => navigate('/my-courses');
    const handleStepChange = (step) => setCurrentStep(step); // Allow free navigation
    const handleNext = () => {
        if (moduleData && currentStep < moduleData.components.length - 1) {
             setCurrentStep(prev => prev + 1);
        } else {
             console.log(`${LOG_PREFIX} Already on last step or cannot go next.`);
             // Consider navigating away or showing completion message
        }
    };
    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };
    const handleAnswerChange = (questionId, value) => setAssessmentAnswers(prev => ({ ...prev, [questionId]: value }));

    // --- Completion Logic Handlers ---

    // Called by UserLearningContentViewer
    const handleCompleteLearningComponent = async () => {
        if (!activeComponent || isAssessment(activeComponent.type) || !currentUser || !moduleId) return;
        const componentId = activeComponent.id;
        console.log(`${LOG_PREFIX} handleCompleteLearningComponent called for: ${componentId}`);

        if (isComponentCompleted(componentId)) { // Prevent duplicate API calls
            console.log(`${LOG_PREFIX} Component ${componentId} already complete. Moving next.`);
            handleNext();
            return;
        }

        setComponentLoading(true); // Indicate activity
        setComponentError(null);
        try {
            console.log(`${LOG_PREFIX} Calling API to complete component ${componentId}`);
            await progressService.completeComponent(moduleId, componentId, {});
            console.log(`${LOG_PREFIX} API success. Updating local progress for ${componentId}.`);
            updateLocalComponentProgress(componentId, true);
            console.log(`${LOG_PREFIX} Moving to next step.`);
            handleNext();
        } catch (err) {
            console.error(`${LOG_PREFIX} Error marking component ${componentId} complete:`, err);
            setComponentError('Failed to save completion status.');
        } finally {
            setComponentLoading(false);
        }
    };

    // Called by assessment form submission
    const handleSubmitAssessment = async () => {
        if (!activeComponent?.questions || !currentUser || !moduleId || assessmentComplete) return;
        const componentId = activeComponent.id;
        console.log(`${LOG_PREFIX} handleSubmitAssessment called for: ${componentId}`);

        // Basic validation (ensure all questions answered)
        const allAnswered = activeComponent.questions.every(q => assessmentAnswers[q.id] !== undefined);
        if (!allAnswered && activeComponent.questions.length > 0) { // Check length > 0
            setComponentError('Please answer all questions.');
            return;
        }

        setComponentLoading(true);
        setComponentError(null);
        try {
            // 1. Submit answers to get score/result
            const formattedAnswers = Object.entries(assessmentAnswers).map(([questionId, answerId]) => ({ questionId, answerId }));
            console.log(`${LOG_PREFIX} Submitting answers for assessment ${componentId}`);
            const response = await assessmentService.submitAnswers(componentId, formattedAnswers);
            const result = response.data; // { score: number, passed: boolean, feedback: any }
            console.log(`${LOG_PREFIX} Assessment submission result:`, result);

            // Update UI state immediately
            setAssessmentComplete(true);
            setAssessmentScore(result.score);
            setAssessmentFeedback(result.feedback);

            // 2. Mark component as complete in progress service with the score
            console.log(`${LOG_PREFIX} Calling API to complete assessment component ${componentId} with score ${result.score}.`);
            await progressService.completeComponent(moduleId, componentId, { scoreValue: result.score });
            console.log(`${LOG_PREFIX} API success. Updating local progress for assessment ${componentId}.`);

            // 3. Update local progress map
            updateLocalComponentProgress(componentId, true, result.score);

        } catch (err) {
            console.error(`${LOG_PREFIX} Error submitting assessment ${componentId}:`, err);
            setComponentError(err.response?.data?.message || 'Failed to submit assessment.');
            setAssessmentComplete(false); // Allow retry maybe? Reset UI state partly.
            setAssessmentScore(null);
        } finally {
            setComponentLoading(false);
        }
    };

    // --- Rendering ---
    console.log(`${LOG_PREFIX} Entering main render. Loading: ${loading}, Error: ${!!error}, ModuleData: ${!!moduleData}`);

    // Loading State
    if (loading) {
        return ( <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}><Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}><CircularProgress /><Typography sx={{ ml: 2 }}>Loading Module...</Typography></Paper></Container> );
    }
    // Error State
    if (error) {
        return ( <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}><Alert severity="error" action={ <Button color="inherit" size="small" onClick={() => window.location.reload()}> Retry </Button> }>{error}</Alert></Container> );
    }
    // No Module Data or No Components State
    if (!moduleData || !Array.isArray(moduleData.components) || moduleData.components.length === 0) {
         console.log(`${LOG_PREFIX} Rendering 'No Module Data / No Components' state.`);
         return ( <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}><Paper sx={{ p: 3 }}><Typography>Module data could not be loaded or has no components defined.</Typography><Button onClick={() => window.location.reload()} sx={{mt: 2}}>Retry</Button></Paper></Container> );
     }

    // --- Main Module View Render ---
    console.log(`${LOG_PREFIX} Rendering Main Module View. Current Step: ${currentStep}`);
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
             <Button startIcon={<ArrowBackIcon />} onClick={handleBackToCourses} sx={{ mb: 2 }}>Back to My Courses</Button>
            <Paper elevation={3} sx={{ p: 3 }}>
                {/* Header */}
                <Typography variant="h4" gutterBottom>{moduleData.title}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{moduleData.description}</Typography>
                {/* Assuming domain/duration might be optional */}
                {moduleData.domain?.name && (<Chip icon={<DomainIcon />} label={moduleData.domain.name} size="small" sx={{ mr: 1 }} />)}
                {moduleData.estimatedDuration && (<Chip icon={<TimerIcon />} label={`${moduleData.estimatedDuration} min estimated`} size="small" />)}
                <Divider sx={{ my: 2 }} />

                {/* Overall Progress Bar */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" display="block" gutterBottom>Module Progress ({Math.round(overallProgress)}%)</Typography>
                    <LinearProgress variant="determinate" value={overallProgress} />
                </Box>

                 {/* Stepper */}
                 <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 3 }}>
                     {moduleData.components.map((component, index) => {
                         if (!component || !component.id) return null; // Safety check
                        const completed = isComponentCompleted(component.id);
                        return (
                            <Step key={component.id} completed={completed}>
                                <StepButton onClick={() => handleStepChange(index)}>
                                    <StepLabel icon={getStepIcon(component.type, completed)}>{component.title}</StepLabel>
                                </StepButton>
                            </Step>
                        );
                     })}
                 </Stepper>

                {/* Active Component Content Area */}
                <Card variant="outlined">
                    <CardContent sx={{ minHeight: '250px', position: 'relative' }}>
                        {/* Loading overlay for component content */}
                        {componentLoading && ( <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)', zIndex: 1 }}><CircularProgress /></Box> )}
                        {/* Error display for component content */}
                        {componentError && ( <Alert severity="error" onClose={() => setComponentError(null)} sx={{ mb: 2 }}>{componentError}</Alert> )}

                        {/* Render active component view */}
                        {activeComponent ? renderActiveComponent()
                         : !componentLoading && !componentError ? ( // Placeholder only if not loading and no error
                            <Typography sx={{ textAlign: 'center', color: 'text.secondary', p:3 }}>Select a step.</Typography>
                         ) : null /* Otherwise render nothing (covered by loading/error) */ }
                    </CardContent>
                </Card>

                 {/* Navigation Buttons */}
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                     <Button startIcon={<ArrowBackIcon />} onClick={handlePrevious} disabled={currentStep === 0 || componentLoading}> Previous </Button>
                     <Button endIcon={<ArrowForwardIcon />} onClick={handleNext} disabled={
                         currentStep >= moduleData.components.length - 1 || // On last step
                         componentLoading || // Content is loading
                         // Disable if current step is required but not yet marked complete
                         (activeComponent && !isComponentCompleted(activeComponent.id) && (activeComponent.requiredToAdvance || isAssessment(activeComponent.type)))
                     }>Next</Button>
                 </Box>
            </Paper>
        </Container>
    );

    // --- Helper: Get Step Icon ---
    function getStepIcon(type, completed) {
         if (completed) return <DoneIcon color="success" />;
         switch (type) {
             case 'PRE_ASSESSMENT': case 'POST_ASSESSMENT': return <AssignmentIcon />;
             // Treat all others as learning content for icon purposes
             default: return <BookIcon />;
         }
     }

    // --- Helper: Render Active Component View ---
    function renderActiveComponent() {
        console.log(`${LOG_PREFIX} renderActiveComponent called for:`, activeComponent);
        if (!activeComponent) return null;

        if (isAssessment(activeComponent.type)) {
            console.log(`${LOG_PREFIX} Rendering Assessment Component view.`);
            return renderAssessmentComponent();
        } else {
            console.log(`${LOG_PREFIX} Rendering UserLearningContentViewer for componentId: ${activeComponent.id}`);
            return (
                <>
                 {/* Optional: Title/Description specific to component can go here if needed */}
                 {/* <Typography variant="h6" gutterBottom>{activeComponent.title}</Typography> */}
                 {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{activeComponent.description}</Typography> */}

                 <UserLearningContentViewer
                     key={activeComponent.id} // Key ensures component remounts on ID change
                     componentId={activeComponent.id}
                     onComplete={handleCompleteLearningComponent} // Pass completion handler
                 />
                </>
            );
        }
    }

     // --- Helper: Render Assessment Component View ---
     function renderAssessmentComponent() {
          console.log(`${LOG_PREFIX} renderAssessmentComponent view. Complete state: ${assessmentComplete}`);
          // Show Results View if completed
          if (assessmentComplete) {
              return (
                 <Box sx={{ mt: 2 }}>
                     <Typography variant="h6">Assessment Results</Typography>
                     {assessmentScore !== null && (
                         <>
                             <Chip label={assessmentScore >= (activeComponent.passingScore || 70) ? 'Passed' : 'Failed'}
                                 color={assessmentScore >= (activeComponent.passingScore || 70) ? 'success' : 'error'}
                                 icon={<CheckCircleIcon />} sx={{ mb: 1 }} />
                             <Typography variant="h5" gutterBottom>Your Score: {assessmentScore}%</Typography>
                             <Typography variant="body2" color="text.secondary">Passing Score: {activeComponent.passingScore || 70}%</Typography>
                         </>
                     )}
                     {/* Optionally display feedback */}
                     {assessmentFeedback && (<Box mt={2}><Typography variant="subtitle1">Feedback:</Typography><pre>{JSON.stringify(assessmentFeedback, null, 2)}</pre></Box>)}
                     {/* Next button outside handles navigation */}
                 </Box>
             );
         }

         // Show Form View if not completed
         const questions = activeComponent.questions;
         // Handle loading/error/no questions states for the form itself
         if (!questions && !componentError && componentLoading) return <Typography>Loading questions...</Typography>; // Check componentLoading
         if (componentError && !questions) return <Alert severity="warning">Could not load assessment questions.</Alert>;
         if (!questions || questions.length === 0) {
             // If assessment has no questions, allow immediate completion?
              return (
                  <>
                     <Typography variant="h6" gutterBottom>{activeComponent.title}</Typography>
                     <Typography sx={{ mb: 2 }}>This assessment has no questions defined.</Typography>
                     {/* Button to mark this step complete since there are no questions */}
                     <Button onClick={handleCompleteLearningComponent} variant="contained">Mark Step Complete</Button>
                  </>
              );
          }

         // Render the assessment form
         return (
             <>
                 <Typography variant="h6" gutterBottom>{activeComponent.title}</Typography>
                 {activeComponent.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{activeComponent.description}</Typography>}
                 <form onSubmit={(e) => { e.preventDefault(); handleSubmitAssessment(); }}>
                     {questions.map((q, index) => (
                         <FormControl component="fieldset" key={q.id} sx={{ mb: 3, width: '100%' }}>
                             <FormLabel component="legend">{index + 1}. {q.text}</FormLabel>
                             <RadioGroup name={`question_${q.id}`} value={assessmentAnswers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} >
                                 {q.options?.map((opt) => ( <FormControlLabel key={opt.id} value={opt.id} control={<Radio />} label={opt.text} /> )) || <Typography variant="caption">No options.</Typography>}
                             </RadioGroup>
                         </FormControl>
                     ))}
                     <Button type="submit" variant="contained" disabled={componentLoading || Object.keys(assessmentAnswers).length !== questions.length}> Submit Assessment </Button>
                 </form>
             </>
         );
     }

}; // End of ModuleView component

export default ModuleView;
