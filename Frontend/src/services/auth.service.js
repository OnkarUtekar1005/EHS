import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/auth';

class AuthService {
  async login(username, password) {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      
      if (response.data.token) {
        // Store user data and token in localStorage
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      // Handle login errors
      if (error.response) {
        // The request was made and the server responded with a status code
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server');
      } else {
        // Something happened in setting up the request
        throw new Error('Error during login');
      }
    }
  }

  logout() {
    // Remove user data from localStorage
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  }

  async getCurrentUserProfile() {
    const user = this.getCurrentUser();
    if (!user || !user.token) return null;

    try {
      const response = await axios.get(`${API_URL}/user`, {
        headers: { 
          'Authorization': `Bearer ${user.token}` 
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile', error);
      return null;
    }
  }
}

export default new AuthService();