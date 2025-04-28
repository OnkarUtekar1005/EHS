import React, { useState, useEffect } from 'react';
import { userService } from '../../../services/api';
import Papa from 'papaparse';
import { domainService } from '../../../services/api';
import { useLocation } from 'react-router-dom';



const UserManagement = () => {
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

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Handle add user
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email) {
      alert('Username and email are required');
      return;
    }

    const password = generatePassword();
    setGeneratedPassword(password);

    try {
      await userService.create({ 
        ...newUser, 
        password 
      });
      
      fetchUsers();
      setShowAddModal(false);
      setShowPasswordGenerated(true);
      setNewUser({ username: '', email: '', role: '' });
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    }
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
            role: 'USER',
            password: generatePassword()
          }));
          setBulkPreview(preview);
        }
      });
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    if (!csvFile) {
      alert('Please select a CSV file');
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
            alert(`${invalidEntries.length} users have invalid data`);
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
            alert(`${createdUsers.length} users imported successfully`);
          }
          
          // Show error if some users failed
          if (failedUsers.length > 0) {
            console.error('Failed users:', failedUsers);
            alert(`${failedUsers.length} users failed to import`);
          }
        } catch (error) {
          console.error('Error in bulk import:', error);
          alert('Error processing bulk import');
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
      alert(`${selectedUsers.length} users deleted successfully`);
    } catch (error) {
      console.error('Error deleting users:', error);
      alert(error.response?.data?.message || 'Failed to delete users');
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
      alert('Please select users first');
      return;
    }
  
    if (!selectedDomainId) {
      alert('Please select a domain to assign');
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
      alert('Domain assigned successfully');
    } catch (error) {
      console.error('Error assigning domain:', error);
      alert('Failed to assign domain');
    }
  };


  // Export to CSV
  const handleExportCSV = () => {
    const csvData = filteredUsers.map(user => ({
      Username: user.username,
      Email: user.email,
      Role: user.role
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'users.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  
  
  // CSS styles to match the second image
  const styles = {
    container: {
      paddingLeft: '250px',
      paddingRight: '20px',
      paddingTop: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: 'calc(100vh - 60px)',
    },
    header: {
      color: '#333',
      marginBottom: '20px',
      fontWeight: '500'
    },
    btnPrimary: {
      backgroundColor: '#1976d2',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    btnOutline: {
      backgroundColor: 'white',
      color: '#1976d2',
      border: '1px solid #1976d2',
      padding: '8px 16px',
      borderRadius: '4px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    searchInput: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      width: '100%'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'white',
      width: '100%'
    },
    table: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    tableHeader: {
      backgroundColor: 'white',
      color: '#333',
      fontWeight: '500',
      padding: '12px 16px',
      textAlign: 'left',
      borderBottom: '1px solid #eee'
    },
    tableCell: {
      padding: '12px 16px',
      borderBottom: '1px solid #eee'
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
    <div style={styles.container}>
      <h2 style={styles.header}>Users</h2>
      
      {/* Action Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button style={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
          <span style={{ marginRight: '5px' }}>+</span> ADD USER
        </button>
        <button style={styles.btnOutline} onClick={() => setShowBulkImportModal(true)}>
          <span style={{ marginRight: '5px' }}>↑</span> BULK IMPORT
        </button>
        <button style={styles.btnOutline} onClick={handleExportCSV}>
          <span style={{ marginRight: '5px' }}>↓</span> EXPORT CSV
        </button>
      </div>
      
      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <div style={{ width: '33%' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          </div>
        </div>
        <div style={{ width: '33%' }}>
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
        <div style={{ width: '33%' }}>
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
      
      {/* Users Table */}
      <div style={styles.table}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                />
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
                <tr key={user.id} style={{ backgroundColor: 'white' }}>
                  <td style={styles.tableCell}>
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelect(user.id)}
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
      </div>
      
      {/* Selection Actions */}
      <div style={styles.selectionRow}>
        <span style={{ marginRight: '20px' }}>Selected: {selectedUsers.length} users</span>
        <button 
  style={{ ...styles.btnOutline, marginRight: '10px', opacity: selectedUsers.length === 0 ? 0.6 : 1 }}
  disabled={selectedUsers.length === 0}
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
  style={{ ...styles.btnOutline, opacity: selectedUsers.length === 0 ? 0.6 : 1 }}
  disabled={selectedUsers.length === 0}
  onClick={() => setIsDeleteModalOpen(true)}
>
  DELETE USER
</button>
      </div>
      
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
                onClick={handleAddUser}
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
                    alert('Password copied to clipboard');
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
    </div>
  );
};

export default UserManagement;