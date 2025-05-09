// // src/pages/admin/ModuleCreator.js
// import React, { useState, useEffect } from 'react';
// import {
//   Container,
//   Paper,
//   Typography,
//   Box,
//   TextField,
//   MenuItem,
//   Grid,
//   Button,
//   IconButton,
//   List,
//   ListItem,
//   Divider,
//   Card,
//   CardContent,
//   FormControl,
//   InputLabel,
//   Select,
//   InputAdornment,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   CircularProgress,
//   Alert,
//   Tooltip
// } from '@mui/material';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// import {
//   Add as AddIcon,
//   ArrowUpward as ArrowUpIcon,
//   ArrowDownward as ArrowDownIcon,
//   Edit as EditIcon,
//   Delete as DeleteIcon,
//   Save as SaveIcon,
//   Cancel as CancelIcon,
//   SmartToy as AIIcon,
//   Visibility as PreviewIcon
// } from '@mui/icons-material';
// import { useNavigate, useParams } from 'react-router-dom';
// import { moduleService, domainService, materialLibraryService } from '../../services/api';
// import AssessmentCreator from './AssessmentCreator';
// import LearningMaterialBrowser from './LearningMaterialBrowser';

// const ModuleCreator = () => {
//   const navigate = useNavigate();
//   const { moduleId } = useParams();
//   const isEditing = !!moduleId;
  
//   // Module state
//   const [moduleData, setModuleData] = useState({
//     title: '',
//     domainId: '',
//     description: '',
//     estimatedDuration: 45,
//     requiredScore: 70,
//     status: 'DRAFT'
//   });
  
//   // Components state
//   const [components, setComponents] = useState([
//     { id: 'pre-assess', type: 'PRE_ASSESSMENT', title: 'Pre-Assessment', configured: false, data: {} },
//     { id: 'learning', type: 'LEARNING_MATERIAL', title: 'Learning Materials', configured: false, data: {} },
//     { id: 'post-assess', type: 'POST_ASSESSMENT', title: 'Post-Assessment', configured: false, data: {} }
//   ]);
  
//   // UI state
//   const [domains, setDomains] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [saveLoading, setSaveLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
  
//   // Dialog state
//   const [openDialog, setOpenDialog] = useState(false);
//   const [dialogType, setDialogType] = useState('');
//   const [selectedComponent, setSelectedComponent] = useState(null);
//   const [addComponentDialog, setAddComponentDialog] = useState(false);
//   const [newComponentType, setNewComponentType] = useState('');
  
//   // Load domains and module data (if editing)
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         console.log("[ModuleCreator] Initializing with moduleId:", moduleId);
        
//         // Fetch domains
//         const domainsResponse = await domainService.getAll();
//         setDomains(domainsResponse.data);
//         console.log("[ModuleCreator] Domains loaded:", domainsResponse.data);
        
//         // If editing, fetch module data
//         if (isEditing) {
//           console.log("[ModuleCreator] Loading existing module:", moduleId);
//           const moduleResponse = await moduleService.getById(moduleId);
//           const module = moduleResponse.data;
//           console.log("[ModuleCreator] Module data loaded:", module);
          
//           // Set basic module data
//           setModuleData({
//             title: module.title || '',
//             domainId: module.domain?.id || '',
//             description: module.description || '',
//             estimatedDuration: module.estimatedDuration || 45,
//             requiredScore: module.requiredScore || 70,
//             status: module.status || 'DRAFT'
//           });
          
//           // Set components if available
//           if (module.components && module.components.length > 0) {
//             console.log("[ModuleCreator] Module has components:", module.components);
//             setComponents(module.components.map(comp => ({
//               id: comp.id,
//               type: comp.type,
//               title: comp.title || getDefaultTitleForType(comp.type),
//               configured: true, // Assuming components from API are configured
//               data: comp.data || {}
//             })));
//           }
//         } else {
//           console.log("[ModuleCreator] Creating new module");
//         }
//       } catch (err) {
//         console.error('[ModuleCreator] Error loading data:', err);
//         setError(err.response?.data?.message || 'Failed to load data');
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchData();
//   }, [isEditing, moduleId]);
  
//   // Helper function to get default title for component type
//   const getDefaultTitleForType = (type) => {
//     switch (type) {
//       case 'PRE_ASSESSMENT':
//         return 'Pre-Assessment';
//       case 'POST_ASSESSMENT':
//         return 'Post-Assessment';
//       case 'LEARNING_MATERIAL':
//         return 'Learning Materials';
//       case 'VIDEO':
//         return 'Video Content';
//       case 'PRESENTATION':
//         return 'Presentation Slides';
//       case 'INTERACTIVE':
//         return 'Interactive Exercise';
//       default:
//         return 'New Component';
//     }
//   };
  
//   // Handle input changes for module data
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setModuleData({
//       ...moduleData,
//       [name]: value
//     });
//   };
  
//   // Handle drag and drop reordering
//   const handleDragEnd = (result) => {
//     if (!result.destination) return;
    
//     console.log("[ModuleCreator] Drag and drop reordering:", result);
    
//     const items = Array.from(components);
//     const [reorderedItem] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, reorderedItem);
    
//     setComponents(items);
//   };

//   // Open component configuration dialog
//   const handleConfigureComponent = (component) => {
//     console.log("[ModuleCreator] Configuring component:", component);
//     setSelectedComponent(component);
//     setDialogType(component.type);
//     setOpenDialog(true);
    
//     // For learning materials, use the specific handler
//     if (component.type === 'LEARNING_MATERIAL') {
//       setDialogType('LEARNING_MATERIAL');
//     }
//   };

//   // Save learning material configuration
//   const handleSaveLearningMaterial = (materials) => {
//     console.log("[ModuleCreator] Received selected materials from browser:", materials);
    
//     // Update the component with the selected materials
//     const updatedComponents = components.map(comp => 
//       comp.id === selectedComponent.id
//         ? { 
//             ...comp, 
//             title: comp.title || 'Learning Materials', 
//             configured: true, 
//             data: { 
//               ...comp.data,
//               materials 
//             } 
//           }
//         : comp
//     );
    
//     console.log("[ModuleCreator] Updated components with selected materials:", updatedComponents);
//     setComponents(updatedComponents);
//     setOpenDialog(false);
//   };
  
//   // Move component up
//   const handleMoveUp = (index) => {
//     if (index === 0) return;
    
//     const items = Array.from(components);
//     const temp = items[index];
//     items[index] = items[index - 1];
//     items[index - 1] = temp;
    
//     setComponents(items);
//   };
  
//   // Move component down
//   const handleMoveDown = (index) => {
//     if (index === components.length - 1) return;
    
//     const items = Array.from(components);
//     const temp = items[index];
//     items[index] = items[index + 1];
//     items[index + 1] = temp;
    
//     setComponents(items);
//   };
  
//   // Delete component
//   const handleDeleteComponent = (index) => {
//     console.log("[ModuleCreator] Deleting component at index:", index);
//     const items = Array.from(components);
//     items.splice(index, 1);
//     setComponents(items);
//   };
  
//   // Open add component dialog
//   const handleOpenAddDialog = () => {
//     setAddComponentDialog(true);
//     setNewComponentType('');
//   };
  
//   // Close add component dialog
//   const handleCloseAddDialog = () => {
//     setAddComponentDialog(false);
//   };
  
//   // Add new component
//   const handleAddComponent = () => {
//     if (!newComponentType) return;
    
//     console.log("[ModuleCreator] Adding new component of type:", newComponentType);
//     const newComponent = {
//       id: `comp-${Date.now()}`,
//       type: newComponentType,
//       title: getDefaultTitleForType(newComponentType),
//       configured: false,
//       data: {}
//     };
    
//     setComponents([...components, newComponent]);
//     setAddComponentDialog(false);
//   };
  
//   // Save assessment configuration
//   const handleSaveAssessment = (assessmentData) => {
//     console.log("[ModuleCreator] Saving assessment data:", assessmentData);
    
//     // Update the component with the new configuration
//     const updatedComponents = components.map(comp => 
//       comp.id === selectedComponent.id
//         ? { ...comp, title: assessmentData.title, configured: true, data: assessmentData }
//         : comp
//     );
    
//     setComponents(updatedComponents);
//     setOpenDialog(false);
//   };
  
//   // Close component dialog
//   const handleCloseDialog = () => {
//     setOpenDialog(false);
//   };
  
//   // Properly format the module data for submission
//   const formatModuleDataForSubmission = () => {
//     console.log("[ModuleCreator] Formatting module data for submission");
    
//     const formattedData = {
//       title: moduleData.title,
//       description: moduleData.description,
//       domainId: moduleData.domainId,
//       estimatedDuration: moduleData.estimatedDuration,
//       requiredCompletionScore: moduleData.requiredScore, // Match the server-side name
//       status: moduleData.status,
//       components: components.map((comp, index) => {
//         console.log(`[ModuleCreator] Formatting component ${index}:`, comp);
        
//         // Format data correctly for different component types
//         let formattedData = { ...comp.data };
        
//         // Ensure assessment questions are properly formatted
//         if (comp.type === 'PRE_ASSESSMENT' || comp.type === 'POST_ASSESSMENT') {
//           if (formattedData.questions) {
//             formattedData.questions = formattedData.questions.map(q => ({
//               text: q.text,
//               type: q.type,
//               points: q.points || 1,
//               options: q.options || [],
//               explanation: q.explanation || ''
//             }));
//           }
//         }
        
//         // For learning materials, include only material IDs
//         if (comp.type === 'LEARNING_MATERIAL' && formattedData.materials) {
//           // Extract just the material IDs and their sequence order for the backend
//           formattedData.materialAssociations = formattedData.materials.map((material, idx) => ({
//             materialId: material.id,
//             sequenceOrder: idx + 1
//           }));
          
//           // Remove the full materials array as we'll use associations instead
//           delete formattedData.materials;
//         }
        
//         const formattedComponent = {
//           id: comp.id && comp.id.startsWith('comp-') ? null : comp.id,
//           title: comp.title,
//           type: comp.type,
//           description: comp.description || '',
//           sequenceOrder: index + 1,
//           requiredToAdvance: true,
//           estimatedDuration: comp.estimatedDuration || 30,
//           data: formattedData
//         };
        
//         console.log(`[ModuleCreator] Formatted component ${index}:`, formattedComponent);
//         return formattedComponent;
//       })
//     };
    
//     console.log("[ModuleCreator] Final formatted module data:", formattedData);
//     return formattedData;
//   };
  
//   // Save module
//   const handleSaveModule = async () => {
//     try {
//       setSaveLoading(true);
//       setError('');
      
//       // Validate form
//       if (!moduleData.title) {
//         setError('Module title is required');
//         setSaveLoading(false);
//         return;
//       }
      
//       if (!moduleData.domainId) {
//         setError('Please select a domain');
//         setSaveLoading(false);
//         return;
//       }
      
//       // Prepare data for API with proper formatting
//       const submitData = formatModuleDataForSubmission();
      
//       console.log('[ModuleCreator] Submitting module data:', submitData);
      
//       // Create/update module
//       console.log("[ModuleCreator] Sending module data to server");
//       const response = await moduleService.create(submitData);
//       const createdModule = response.data;
//       console.log('[ModuleCreator] Server response for module creation:', createdModule);
      
//       // Associate materials with components after module is created
//       if (createdModule && createdModule.components) {
//         try {
//           // Process each component to associate materials
//           for (const component of components.filter(c => c.type === 'LEARNING_MATERIAL')) {
//             // Find the corresponding created component
//             const createdComponent = createdModule.components.find(cc => 
//               cc.title === component.title && cc.type === component.type
//             );
            
//             if (createdComponent && component.data?.materials?.length > 0) {
//               console.log(`[ModuleCreator] Associating materials with component ${createdComponent.id}`);
              
//               // Get array of material IDs
//               const materialIds = component.data.materials.map(m => m.id);
              
//               // Associate materials with the component
//               if (materialIds.length > 0) {
//                 await materialLibraryService.associateMaterialsWithComponent(
//                   createdComponent.id,
//                   materialIds
//                 );
//                 console.log(`[ModuleCreator] Associated ${materialIds.length} materials with component ${createdComponent.id}`);
//               }
//             }
//           }
//         } catch (materialErr) {
//           console.error('[ModuleCreator] Error associating materials with components:', materialErr);
//           setError('Module was saved, but some learning materials could not be associated');
//           setSaveLoading(false);
//           return;
//         }
//       }
      
//       setSuccess('Module saved successfully');
      
//       // Redirect to module list after a short delay
//       setTimeout(() => {
//         navigate('/admin/modules');
//       }, 2000);
      
//     } catch (err) {
//       console.error('[ModuleCreator] Error saving module:', err);
//       console.error('[ModuleCreator] Error details:', err.response?.data || err.message);
//       setError(err.response?.data?.message || 'Failed to save module');
//     } finally {
//       setSaveLoading(false);
//     }
//   };
  
//   // Cancel and go back
//   const handleCancel = () => {
//     navigate('/admin/modules');
//   };
  
//   // AI Generate
//   const handleAIGenerate = () => {
//     // Placeholder for AI generation
//     alert('This feature is not implemented yet');
//   };
  
//   // Preview module
//   const handlePreviewModule = () => {
//     // Open preview in new tab or modal
//     alert('Preview functionality not implemented yet');
//   };
  
//   // Component type options
//   const componentTypes = [
//     { value: 'PRE_ASSESSMENT', label: 'Pre-Assessment' },
//     { value: 'LEARNING_MATERIAL', label: 'Learning Materials' },
//     { value: 'VIDEO', label: 'Video' },
//     { value: 'PRESENTATION', label: 'Presentation' },
//     { value: 'INTERACTIVE', label: 'Interactive Exercise' },
//     { value: 'POST_ASSESSMENT', label: 'Post-Assessment' }
//   ];
  
//   return (
//     <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
//       <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
//         <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
//           <Typography variant="h4">
//             {isEditing ? 'Edit Module: ' : 'Create Module: '}
//             {moduleData.title || 'New Module'}
//           </Typography>
//           <Box>
//             <Button 
//               variant="contained" 
//               color="primary" 
//               startIcon={<SaveIcon />}
//               onClick={handleSaveModule}
//               disabled={saveLoading}
//               sx={{ mr: 1 }}
//             >
//               {saveLoading ? <CircularProgress size={24} /> : 'Save'}
//             </Button>
//             <Button 
//               variant="outlined"
//               startIcon={<CancelIcon />}
//               onClick={handleCancel}
//               disabled={saveLoading}
//             >
//               Cancel
//             </Button>
//           </Box>
//         </Box>
        
//         {error && (
//           <Alert severity="error" sx={{ mb: 3 }}>
//             {error}
//           </Alert>
//         )}
        
//         {success && (
//           <Alert severity="success" sx={{ mb: 3 }}>
//             {success}
//           </Alert>
//         )}
        
//         {/* Module Settings */}
//         <Box mb={4}>
//           <Typography variant="h6" gutterBottom>Module Settings</Typography>
//           <Grid container spacing={3}>
//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Title"
//                 name="title"
//                 value={moduleData.title}
//                 onChange={handleInputChange}
//                 required
//                 disabled={loading}
//               />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <FormControl fullWidth>
//                 <InputLabel>Domain</InputLabel>
//                 <Select
//                   name="domainId"
//                   value={moduleData.domainId}
//                   onChange={handleInputChange}
//                   label="Domain"
//                   disabled={loading}
//                 >
//                   {domains.map(domain => (
//                     <MenuItem key={domain.id} value={domain.id}>
//                       {domain.name}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={12} sm={3}>
//               <TextField
//                 fullWidth
//                 label="Estimated Duration"
//                 name="estimatedDuration"
//                 type="number"
//                 value={moduleData.estimatedDuration}
//                 onChange={handleInputChange}
//                 InputProps={{
//                   endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
//                 }}
//                 disabled={loading}
//               />
//             </Grid>
//             <Grid item xs={12} sm={3}>
//               <TextField
//                 fullWidth
//                 label="Required Completion Score"
//                 name="requiredScore"
//                 type="number"
//                 value={moduleData.requiredScore}
//                 onChange={handleInputChange}
//                 InputProps={{
//                   endAdornment: <InputAdornment position="end">%</InputAdornment>,
//                 }}
//                 disabled={loading}
//               />
//             </Grid>
//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Description"
//                 name="description"
//                 value={moduleData.description}
//                 onChange={handleInputChange}
//                 multiline
//                 rows={3}
//                 disabled={loading}
//               />
//             </Grid>
//           </Grid>
//         </Box>
        
//         {/* Module Components */}
//         <Box>
//           <Typography variant="h6" gutterBottom>Module Components</Typography>
//           <Typography variant="body2" color="textSecondary" gutterBottom>
//             Drag components to reorder
//           </Typography>
          
//           <DragDropContext onDragEnd={handleDragEnd}>
//             <Droppable droppableId="components">
//               {(provided) => (
//                 <List
//                   {...provided.droppableProps}
//                   ref={provided.innerRef}
//                   sx={{ bgcolor: 'background.paper' }}
//                 >
//                   {components.map((component, index) => (
//                     <Draggable key={component.id} draggableId={component.id} index={index}>
//                       {(provided) => (
//                         <ListItem
//                           ref={provided.innerRef}
//                           {...provided.draggableProps}
//                           {...provided.dragHandleProps}
//                           sx={{ mb: 2 }}
//                         >
//                           <Card variant="outlined" sx={{ width: '100%' }}>
//                             <CardContent>
//                               <Box display="flex" justifyContent="space-between" alignItems="center">
//                                 <Box>
//                                   <Typography variant="subtitle1">
//                                     {index + 1}. {component.title}
//                                   </Typography>
//                                   <Typography variant="body2" color="textSecondary">
//                                     Type: {getDefaultTitleForType(component.type)}
//                                   </Typography>
//                                   <Typography variant="body2" color="textSecondary">
//                                     Status: {component.configured ? 'Configured' : 'Not configured'}
//                                   </Typography>
//                                   {component.type === 'LEARNING_MATERIAL' && 
//                                    component.data?.materials?.length > 0 && (
//                                     <Typography variant="body2" color="textSecondary">
//                                       Materials: {component.data.materials.length}
//                                     </Typography>
//                                   )}
//                                   <Button
//                                     variant="outlined"
//                                     size="small"
//                                     sx={{ mt: 1 }}
//                                     onClick={() => handleConfigureComponent(component)}
//                                   >
//                                     Configure {component.title}
//                                   </Button>
//                                 </Box>
//                                 <Box>
//                                   <Tooltip title="Move Up">
//                                     <span>
//                                       <IconButton 
//                                         onClick={() => handleMoveUp(index)}
//                                         disabled={index === 0}
//                                       >
//                                         <ArrowUpIcon />
//                                       </IconButton>
//                                     </span>
//                                   </Tooltip>
//                                   <Tooltip title="Move Down">
//                                     <span>
//                                       <IconButton 
//                                         onClick={() => handleMoveDown(index)}
//                                         disabled={index === components.length - 1}
//                                       >
//                                         <ArrowDownIcon />
//                                       </IconButton>
//                                     </span>
//                                   </Tooltip>
//                                   <Tooltip title="Edit">
//                                     <IconButton onClick={() => handleConfigureComponent(component)}>
//                                       <EditIcon />
//                                     </IconButton>
//                                   </Tooltip>
//                                   <Tooltip title="Delete">
//                                     <IconButton onClick={() => handleDeleteComponent(index)}>
//                                       <DeleteIcon />
//                                     </IconButton>
//                                   </Tooltip>
//                                 </Box>
//                               </Box>
//                             </CardContent>
//                           </Card>
//                         </ListItem>
//                       )}
//                     </Draggable>
//                   ))}
//                   {provided.placeholder}
//                 </List>
//               )}
//             </Droppable>
//           </DragDropContext>
          
//           <Box mt={2} display="flex" justifyContent="space-between">
//             <Button
//               variant="outlined"
//               startIcon={<AddIcon />}
//               onClick={handleOpenAddDialog}
//             >
//               Add Component
//             </Button>
//             <Box>
//               <Button
//                 variant="outlined"
//                 startIcon={<AIIcon />}
//                 sx={{ mr: 2 }}
//                 onClick={handleAIGenerate}
//               >
//                 AI Generate Complete Module
//               </Button>
//               <Button
//                 variant="outlined"
//                 startIcon={<PreviewIcon />}
//                 onClick={handlePreviewModule}
//               >
//                 Preview Module
//               </Button>
//             </Box>
//           </Box>
//         </Box>
//       </Paper>
      
//       {/* Add Component Dialog */}
//       <Dialog open={addComponentDialog} onClose={handleCloseAddDialog}>
//         <DialogTitle>Add New Component</DialogTitle>
//         <DialogContent sx={{ minWidth: 400 }}>
//           <FormControl fullWidth sx={{ mt: 2 }}>
//             <InputLabel id="component-type-label">Component Type</InputLabel>
//             <Select
//               labelId="component-type-label"
//               value={newComponentType}
//               onChange={(e) => setNewComponentType(e.target.value)}
//               label="Component Type"
//             >
//               {componentTypes.map((type) => (
//                 <MenuItem key={type.value} value={type.value}>
//                   {type.label}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseAddDialog}>Cancel</Button>
//           <Button 
//             onClick={handleAddComponent} 
//             variant="contained" 
//             disabled={!newComponentType}
//           >
//             Add
//           </Button>
//         </DialogActions>
//       </Dialog>
      
//       {/* Assessment Component Dialog */}
//       <Dialog 
//         open={openDialog && (dialogType === 'PRE_ASSESSMENT' || dialogType === 'POST_ASSESSMENT')} 
//         onClose={handleCloseDialog}
//         fullWidth
//         maxWidth="md"
//       >
//         <DialogContent sx={{ p: 0 }}>
//           {selectedComponent && (
//             <AssessmentCreator
//               assessment={selectedComponent.data}
//               moduleTitle={moduleData.title}
//               assessmentType={dialogType}
//               onSave={handleSaveAssessment}
//               onCancel={handleCloseDialog}
//             />
//           )}
//         </DialogContent>
//       </Dialog>
      
//       {/* Learning Materials Component Dialog */}
//       <Dialog 
//         open={openDialog && dialogType === 'LEARNING_MATERIAL'} 
//         onClose={handleCloseDialog}
//         fullWidth
//         maxWidth="lg"
//       >
//         <DialogContent sx={{ p: 0 }}>
//           {selectedComponent && (
//             <LearningMaterialBrowser
//               componentId={selectedComponent.id}
//               initialMaterials={selectedComponent.data?.materials || []}
//               onSave={handleSaveLearningMaterial}
//               onCancel={handleCloseDialog}
//             />
//           )}
//         </DialogContent>
//       </Dialog>
//     </Container>
//   );
// };

// export default ModuleCreator;