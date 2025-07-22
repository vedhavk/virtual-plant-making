import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    // Check for empty fields
    if (!loginData.email || !loginData.password) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      // Simulate login for testing - replace with actual API call
      if (loginData.email === 'admin@admin.com') {
        if (loginData.password === 'admin') {
          const adminData = { email: loginData.email, role: 'admin', username: 'Admin' };
          localStorage.setItem('user', JSON.stringify(adminData));
          alert('Login successful! Welcome Admin.');
          navigate('/admin');
        } else {
          alert('Invalid credentials. Please check your email and password.');
        }
      } else {
        // Check if user exists in registered users
        const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user = existingUsers.find(u => u.email === loginData.email);
        
        if (user && user.password === loginData.password) {
          const userData = { email: user.email, role: 'user', username: user.username };
          localStorage.setItem('user', JSON.stringify(userData));
          alert(`Login successful! Welcome ${user.username}.`);
          navigate('/plant-select');
        } else {
          alert('Invalid credentials. Please check your email and password.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const checkEmailExists = (email) => {
    // Get existing users from localStorage
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    return existingUsers.some(user => user.email === email);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    // Check for empty fields
    if (!registerData.username || !registerData.email || !registerData.password || !registerData.confirmPassword) {
      alert('Please fill in all fields.');
      return;
    }

    // Check password length
    if (registerData.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Check if email already exists
    if (checkEmailExists(registerData.email)) {
      alert('User already exists with this email. Please use a different email or try signing in.');
      return;
    }

    try {
      // Get existing users and add new user
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const newUser = {
        email: registerData.email,
        username: registerData.username,
        password: registerData.password, // In real app, this should be hashed
        role: 'user'
      };
      
      existingUsers.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
      
      // Show success message and switch to login tab
      alert('Registration successful! Please sign in with your new account.');
      
      // Clear registration form
      setRegisterData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      // Switch to login tab
      setActiveTab('login');
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-4 text-center font-medium text-sm ${
              activeTab === 'login'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 px-4 text-center font-medium text-sm ${
              activeTab === 'register'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Welcome Back
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Sign in to your account
              </p>
              <p className="mt-2 text-center text-xs text-gray-500">
                Demo: Use admin@admin.com / admin for admin access
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    value={loginData.email}
                    onChange={handleLoginChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Sign In
                </button>
              </div>
            </form>
          </>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Create Account
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Join us to start your virtual plant journey
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleRegisterSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="register-username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    id="register-username"
                    name="username"
                    type="text"
                    required
                    value={registerData.username}
                    onChange={handleRegisterChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Choose a username"
                  />
                </div>
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    required
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    required
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Create a password (min 6 characters)"
                  />
                </div>
                <div>
                  <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Create Account
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;