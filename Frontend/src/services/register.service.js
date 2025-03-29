import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/auth';

class RegisterService {
  async register(username, email, password, role = 'EMPLOYEE') {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        username,
        email,
        password,
        role
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        throw new Error(error.response.data.message || 'Registration failed');
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server');
      } else {
        // Something happened in setting up the request
        throw new Error('Error during registration');
      }
    }
  }
}

export default new RegisterService();