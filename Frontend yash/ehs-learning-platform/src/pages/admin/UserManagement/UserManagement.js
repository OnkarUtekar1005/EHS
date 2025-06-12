import React, { useState, useEffect } from 'react';
import { userService } from '../../../services/api';
import Papa from 'papaparse';
import { domainService } from '../../../services/api';
import { useLocation } from 'react-router-dom';
import { Box, Container, Typography, useTheme } from '@mui/material';



const UserManagement = () => {
  const theme = useTheme();
  // States
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showPasswordGenerated, setShowPasswordGenerated] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [newUser, setNewUser] = useState({ username: '', email: '', role: '' });
  const [csvFile, setCsvFile] = useState(null);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [domains, setDomains] = useState([]);

  const [showAssignDomainModal, setShowAssignDomainModal] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState('');

  const location = useLocation();

// Add this useEffect to check for the state
useEffect(() => {
  if (location.state?.openAddUserModal) {
    setShowAddModal(true);
    // Clear the state to prevent reopening on refresh
    window.history.replaceState({}, document.title);
  }
}, [location]);
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchDomains();
  }, []);
  

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll();
      const fetchedUsers = response.data || [];
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await domainService.getAll();
      setDomains(response.data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  // Filter users based on search, role, and domain
  useEffect(() => {
    let result = [...users];
    
    // Filter by role
    if (selectedRole !== 'All Roles') {
      result = result.filter(user => user.role === selectedRole);
    }
    
    // Filter by domain
    if (selectedDomain !== 'All Domains') {
      result = result.filter(user => 
        user.domains && user.domains.some(domain => 
          domain.id === selectedDomain || domain === selectedDomain
        )
      );
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      result = result.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(result);
  }, [selectedRole, selectedDomain, searchTerm, users]);

  // Handle add user after successful creation
  const handleAddUser = (backendGeneratedPassword) => {
    if (backendGeneratedPassword) {
      setGeneratedPassword(backendGeneratedPassword);
      setShowPasswordGenerated(true);
    }

    fetchUsers();
    setShowAddModal(false);
    setNewUser({ username: '', email: '', role: '' });
  };
// Handle edit user
  const handleEditUser = (user) => {
    setNewUser({
      username: user.username,
      email: user.email,
      role: user.role
    });
    setShowAddModal(true);
  };
  
  // Handle delete user
  const handleDeleteUser = (userId) => {
    setSelectedUsers([userId]);
    setIsDeleteModalOpen(true);
  };
  // Handle file change for bulk import
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCsvFile(file);

    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const preview = results.data.slice(0, 5).map(item => ({
            username: item.username || '',
            email: item.email || '',
            role: 'USER'
          }));
          setBulkPreview(preview);
        }
      });
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    if (!csvFile) {
      console.warn('Please select a CSV file');
      return;
    }
  
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        try {
          // Validate data first
          const invalidEntries = results.data.filter(item => !item.username || !item.email);
          if (invalidEntries.length > 0) {
            console.warn(`${invalidEntries.length} users have invalid data`);
            return;
          }
          
          // Make a single API call with all the users
          const response = await userService.bulkCreate(results.data);
          
          // Handle the response
          const createdUsers = response.data.filter(user => user.status === 'success');
          const failedUsers = response.data.filter(user => user.status === 'error');
          
          // Update UI based on results
          if (createdUsers.length > 0) {
            // Refresh the full user list
            fetchUsers();
            
            setShowBulkImportModal(false);
            console.log(`${createdUsers.length} users imported successfully`);
          }
          
          // Show error if some users failed
          if (failedUsers.length > 0) {
            console.error('Failed users:', failedUsers);
            console.error(`${failedUsers.length} users failed to import`);
          }
        } catch (error) {
          console.error('Error in bulk import:', error);
          console.error('Error processing bulk import');
        }
      }
    });
  };


  const handleBulkDelete = async () => {
    try {
      await userService.bulkDelete(selectedUsers);
      
      // Refresh the user list
      fetchUsers();
      
      // Clear selected users
      setSelectedUsers([]);
      
      // Close the modal
      setIsDeleteModalOpen(false);
      
      // Show success message (optional: you could use a toast/snackbar instead)
      console.log(`${selectedUsers.length} users deleted successfully`);
    } catch (error) {
      console.error('Error deleting users:', error);
      console.error(error.response?.data?.message || 'Failed to delete users');
    }
  };
  

  
  // In your render method, update the delete button
 
  // Handle user selection
  const handleUserSelect = (userId) => {
    setSelectedUsers(prevSelected => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter(id => id !== userId);
      } else {
        return [...prevSelected, userId];
      }
    });
  };

  // Handle select all users
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Add this function to handle domain assignment
  const handleAssignDomains = async () => {
    if (selectedUsers.length === 0) {
      console.warn('Please select users first');
      return;
    }
  
    if (!selectedDomainId) {
      console.warn('Please select a domain to assign');
      return;
    }
  
    try {
      await userService.assignBulkDomains({
        userIds: selectedUsers,
        domainIds: [selectedDomainId] // Pass as array with single value
      });
      
      // Refresh users to show updated domain assignments
      fetchUsers();
      setShowAssignDomainModal(false);
      console.log('Domain assigned successfully');
    } catch (error) {
      console.error('Error assigning domain:', error);
      console.error('Failed to assign domain');
    }
  };


  // Export to CSV
  // Replace or update the handleExportCSV function in UserManagement.js
const handleExportCSV = async () => {
  try {
    // Get users with password data from backend
    const response = await userService.exportUsers();
    const usersData = response.data;
    
    // Format data for CSV
    const csvData = usersData.map(user => ({
      Username: user.username,
      Email: user.email,
      Password: user.password || '',
      'First Name': user.firstName || '',
      'Last Name': user.lastName || '',
      Role: user.role,
      Department: user.department || '',
      'Job Title': user.jobTitle || '',
      Domains: user.domains || '',
      'Password Created': user.passwordCreatedAt ? new Date(user.passwordCreatedAt).toLocaleString() : ''
    }));
    
    // Generate CSV
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'users_with_passwords.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting users:', error);
    console.error('Failed to export users');
  }
};
  const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    selectedCount 
  }) => {
    if (!isOpen) return null;
  
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '400px',
          maxWidth: '90%',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            color: '#333', 
            fontSize: '18px' 
          }}>
            Delete Users
          </h3>
          
          <p style={{ 
            color: '#666', 
            marginBottom: '24px' 
          }}>
            Are you sure you want to delete {selectedCount} selected user{selectedCount !== 1 ? 's' : ''}?
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px' 
          }}>
            <button 
              onClick={onClose}
              style={{
                backgroundColor: 'white',
                color: '#1976d2',
                border: '1px solid #1976d2',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            
            <button 
              onClick={onConfirm}
              style={{
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  
  // Modern CSS styles
  const styles = {
    container: {
      padding: '24px',
      backgroundColor: '#f8fafc',
      minHeight: 'calc(100vh - 140px)',
    },
    header: {
      color: '#1e293b',
      marginBottom: '32px',
      fontWeight: '700',
      fontSize: '28px'
    },
    subHeader: {
      color: '#64748b',
      marginBottom: '24px',
      fontSize: '16px',
      fontWeight: '400'
    },
    btnPrimary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: '#2563eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    },
    btnOutline: {
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #d1d5db',
      padding: '12px 20px',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '14px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: '#f9fafb',
        borderColor: '#9ca3af'
      }
    },
    searchInput: {
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      width: '100%',
      fontSize: '14px',
      transition: 'border-color 0.2s ease',
      '&:focus': {
        outline: 'none',
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
      }
    },
    select: {
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      backgroundColor: 'white',
      width: '100%',
      fontSize: '14px',
      transition: 'border-color 0.2s ease',
      '&:focus': {
        outline: 'none',
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
      }
    },
    table: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    tableHeader: {
      backgroundColor: '#f8fafc',
      color: '#374151',
      fontWeight: '600',
      padding: '16px 20px',
      textAlign: 'left',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '14px'
    },
    tableCell: {
      padding: '16px 20px',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '14px',
      color: '#374151'
    },
    noData: {
      padding: '40px 0',
      textAlign: 'center',
      color: '#666'
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    badgePrimary: {
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      color: '#1976d2'
    },
    badgeWarning: {
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      color: '#f57c00'
    },
    actionBtn: {
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      color: '#666'
    },
    selectionRow: {
      padding: '16px 0',
      borderTop: '1px solid #eee',
      color: '#666'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '4px',
      width: '500px',
      maxWidth: '90%',
      boxShadow: '0 3px 6px rgba(0,0,0,0.2)'
    },
    modalHeader: {
      padding: '16px 24px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalBody: {
      padding: '24px',
    },
    modalFooter: {
      padding: '16px 24px',
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px'
    },
    formGroup: {
      marginBottom: '16px'
    },
    formLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: '#333'
    },
    formInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px'
    },
    formSelect: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px'
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        pt: { xs: 2, md: 4 },
        pb: 8,
        width: '100%'
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header Section */}
        <Box sx={{ mb: 4, textAlign: 'left', width: '100%' }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: theme.palette.text.primary
            }}
          >
            User Management
          </Typography>
          <Typography
            variant="subtitle1"
            color="textSecondary"
            sx={{ mb: 3 }}
          >
            Manage users, assign domains, and track employee access across your organization
          </Typography>
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ 
          marginBottom: '24px', 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
        <button style={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
          <span style={{ marginRight: '5px' }}>+</span> ADD USER
        </button>
        <button style={styles.btnOutline} onClick={() => setShowBulkImportModal(true)}>
          <span style={{ marginRight: '5px' }}>↑</span> BULK IMPORT
        </button>
        <button style={styles.btnOutline} onClick={handleExportCSV}>
          <span style={{ marginRight: '5px' }}>↓</span> EXPORT CSV
        </button>
        </Box>
        
        {/* Filters Section */}
        <Box sx={{ 
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
        <h3 style={{ 
          margin: '0 0 16px 0',
          color: '#374151',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          Filter Users
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '280px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Search Users
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                style={styles.searchInput}
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                fontSize: '18px'
              }}>
                🔍
              </span>
            </div>
          </div>
          <div style={{ flex: '0 0 200px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Role
            </label>
            <select 
              style={styles.select}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option>All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">Employee</option>
            </select>
          </div>
          <div style={{ flex: '0 0 200px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Domain
            </label>
            <select 
              style={styles.select}
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              <option value="All Domains">All Domains</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>
          </div>
        </Box>
        
        {/* Users Table */}
        <Box sx={{
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{...styles.tableHeader, width: '60px'}}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer'
                }} onClick={(e) => {
                  e.preventDefault();
                  const syntheticEvent = { target: { checked: !(selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length) } };
                  handleSelectAll(syntheticEvent);
                }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#3b82f6',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>
                    {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : 'Select All'}
                  </span>
                </div>
              </th>
              <th style={styles.tableHeader}>Username</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>Role</th>
              <th style={styles.tableHeader}>Domains</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ ...styles.tableCell, textAlign: 'center' }}>
                  Loading...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.noData}>
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} style={{ 
                  backgroundColor: selectedUsers.includes(user.id) ? '#f0f9ff' : 'white',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#f9fafb'
                  }
                }}>
                  <td style={styles.tableCell}>
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelect(user.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#3b82f6',
                        cursor: 'pointer'
                      }}
                    />
                  </td>
                  <td style={styles.tableCell}>{user.username}</td>
                  <td style={styles.tableCell}>{user.email}</td>
                  <td style={styles.tableCell}>
                    <span 
                      style={{
                        ...styles.badge,
                        ...(user.role === 'ADMIN' ? styles.badgeWarning : styles.badgePrimary)
                      }}
                    >
                      {user.role === 'ADMIN' ? 'Admin' : 'USER'}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
  {user.domains && user.domains.length > 0 
    ? user.domains.map(domain => typeof domain === 'object' ? domain.name : domain).join(', ') 
    : '-'}
</td>
                  <td style={styles.tableCell}>
  <button 
    style={styles.actionBtn} 
    onClick={() => handleEditUser(user)}
  >
    ✏️
  </button>
  <button 
    style={styles.actionBtn} 
    onClick={() => handleDeleteUser(user.id)}
  >
    🗑️
  </button>
</td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </Box>
        
        {/* Selection Actions */}
        {selectedUsers.length > 0 && (
          <Box sx={{
            backgroundColor: '#f0f9ff',
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid #bfdbfe',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ 
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e40af'
            }}>
              {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'} selected
            </span>
            <span style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              Choose an action below
            </span>
          </Box>
          <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              style={{ 
                ...styles.btnOutline,
                fontSize: '13px',
                padding: '8px 16px'
              }}
              onClick={() => setShowAssignDomainModal(true)}
            >
              ASSIGN DOMAIN
            </button>

{showAssignDomainModal && (
  <div style={styles.modal}>
    <div style={styles.modalContent}>
      <div style={styles.modalHeader}>
        <h3 style={{ margin: 0 }}>Assign Domains</h3>
        <button 
          style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
          onClick={() => setShowAssignDomainModal(false)}
        >
          ×
        </button>
      </div>
      <div style={styles.modalBody}>
        <p>Select domain to assign to {selectedUsers.length} selected user(s):</p>
        <div style={styles.formGroup}>
          <select 
            style={styles.formSelect}
            value={selectedDomainId}
            onChange={(e) => setSelectedDomainId(e.target.value)}
          >
            <option value="">Select a domain</option>
            {domains.map(domain => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={styles.modalFooter}>
        <button 
          style={{ padding: '8px 16px', backgroundColor: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          onClick={() => setShowAssignDomainModal(false)}
        >
          Cancel
        </button>
        <button 
          style={styles.btnPrimary}
          onClick={handleAssignDomains}
          disabled={!selectedDomainId}
        >
          Assign Domain
        </button>
      </div>
    </div>
  </div>
)}
            <button 
              style={{ 
                ...styles.btnOutline,
                fontSize: '13px',
                padding: '8px 16px',
                backgroundColor: '#fef2f2',
                borderColor: '#fca5a5',
                color: '#dc2626'
              }}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              DELETE USERS
            </button>
          </Box>
        </Box>
      )}
        
        {/* Add User Modal */}
      {showAddModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Add New User</h3>
              <button 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Username</label>
                <input 
                  type="text" 
                  style={styles.formInput}
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email</label>
                <input 
                  type="email" 
                  style={styles.formInput}
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Role</label>
                <select 
                  style={styles.formSelect}
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="USER">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <p style={{ color: '#666', fontSize: '14px' }}>A password will be generated automatically.</p>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={{ padding: '8px 16px', backgroundColor: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.btnPrimary}
                onClick={async () => {
                  try {
                    // Password will be generated by the backend
                    const response = await userService.create(newUser);

                    // Get backend-generated password from response
                    if (response.data && response.data.password) {
                      handleAddUser(response.data.password);
                    } else {
                      handleAddUser("Error retrieving password");
                    }
                  } catch (error) {
                    console.error('Error adding user:', error);
                    console.error('Failed to add user');
                  }
                }}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Bulk Import Users</h3>
              <button 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                onClick={() => setShowBulkImportModal(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Upload CSV File</label>
                <input 
                  type="file" 
                  style={styles.formInput}
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </div>
              
              {bulkPreview.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>Preview (first {bulkPreview.length} records):</h4>
                  <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #eee' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px 12px', backgroundColor: '#f5f5f5', textAlign: 'left', borderBottom: '1px solid #eee' }}>Username</th>
                          <th style={{ padding: '8px 12px', backgroundColor: '#f5f5f5', textAlign: 'left', borderBottom: '1px solid #eee' }}>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkPreview.map((user, index) => (
                          <tr key={index}>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>{user.username}</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>{user.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div style={{ 
                marginTop: '20px', 
                padding: '12px',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                color: '#1976d2',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                The CSV file should have 'username' and 'email' columns. 
                Passwords will be generated automatically.
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={{ padding: '8px 16px', backgroundColor: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setShowBulkImportModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.btnPrimary}
                onClick={handleBulkImport}
              >
                Import Users
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add the modal component */}
<DeleteConfirmationModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onConfirm={handleBulkDelete}
  selectedCount={selectedUsers.length}
/>

      {/* Password Generated Modal */}
      {showPasswordGenerated && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>User Created Successfully</h3>
              <button 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                onClick={() => setShowPasswordGenerated(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <p>A password has been generated for the new user:</p>
              <div style={{ 
                display: 'flex', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                overflow: 'hidden',
                marginBottom: '20px' 
              }}>
                <input 
                  type="text" 
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px',
                    border: 'none',
                    fontFamily: 'monospace'
                  }} 
                  value={generatedPassword} 
                  readOnly
                />
                <button 
                  style={{ 
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    border: 'none',
                    borderLeft: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    console.log('Password copied to clipboard');
                  }}
                >
                  Copy
                </button>
              </div>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Make sure to share this password with the user securely. 
                They will be prompted to change it on first login.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.btnPrimary}
                onClick={() => setShowPasswordGenerated(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      </Container>
    </Box>
  );
};

export default UserManagement;