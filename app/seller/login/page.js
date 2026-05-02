"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, User, Calendar, FileText, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSeller } from '../../context/SellerContext';

const SellerAuthPage = () => {
  const router = useRouter();
  const { registerSeller, isSellerAuthenticated, loginSeller } = useSeller();
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'register'

  // Register tab state
  const [registerData, setRegisterData] = useState({
    phoneNumber: '',
    name: '',
    age: '',
    gstin: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Login tab state
  const [loginData, setLoginData] = useState({
    phoneOrEmail: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Redirect if already logged in as seller
  useEffect(() => {
    if (isSellerAuthenticated) {
      router.push('/seller/dashboard');
    }
  }, [isSellerAuthenticated, router]);

  // Register handlers
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validation
    if (!registerData.phoneNumber || !registerData.name || !registerData.age || !registerData.gstin || !registerData.email || !registerData.password || !registerData.confirmPassword) {
      setMessage('❌ Please fill all fields');
      return;
    }

    if (registerData.phoneNumber.length !== 10 || !/^\d{10}$/.test(registerData.phoneNumber)) {
      setMessage('❌ Phone number must be 10 digits');
      return;
    }

    if (registerData.age < 18) {
      setMessage('❌ Must be 18+ to register as a seller');
      return;
    }

    if (!/^[A-Z0-9]{15}$/.test(registerData.gstin)) {
      setMessage('❌ GSTIN must be 15 alphanumeric characters');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      setMessage('❌ Invalid email address');
      return;
    }

    if (registerData.password.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await registerSeller(registerData);

      if (result.success) {
        setMessage('✅ Registration successful! Welcome to Bazrush Sellers');

        // Redirect after success
        setTimeout(() => {
          router.push('/seller/dashboard');
        }, 1500);
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Login handlers
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!loginData.phoneOrEmail || !loginData.password) {
      setMessage('❌ Please enter phone/email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await loginSeller(loginData.phoneOrEmail, loginData.password);

      if (result.success) {
        setMessage('✅ Login successful! Redirecting to dashboard...');

        setTimeout(() => {
          router.push('/seller/dashboard');
        }, 1000);
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-8 text-white text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="text-5xl">⚡</span>
              <h1 className="text-3xl font-black">Bazrush</h1>
            </div>
            <p className="text-purple-100 text-lg font-medium">Seller Portal</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setAuthTab('login');
                setMessage('');
              }}
              className={`flex-1 py-4 font-bold transition-all ${
                authTab === 'login'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthTab('register');
                setMessage('');
              }}
              className={`flex-1 py-4 font-bold transition-all ${
                authTab === 'register'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Login Tab */}
          {authTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="p-8 space-y-5">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Login to Your Account</h2>

              {message && (
                <div className={`p-4 rounded-xl text-center font-medium ${
                  message.includes('❌')
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Phone or Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <span>Phone Number or Email</span>
                </label>
                <input
                  type="text"
                  name="phoneOrEmail"
                  placeholder="Enter 10-digit phone or email"
                  value={loginData.phoneOrEmail}
                  onChange={handleLoginChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors placeholder-gray-400"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:shadow-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Logging in...' : 'Login'}</span>
                {!loading && <span>⚡</span>}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                New seller? <button type="button" onClick={() => setAuthTab('register')} className="text-purple-600 font-bold hover:underline">
                  Register here
                </button>
              </p>
            </form>
          )}

          {/* Register Tab */}
          {authTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="p-8 space-y-5">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Join Bazrush Sellers</h2>

              {message && (
                <div className={`p-4 rounded-xl text-center font-medium ${
                  message.includes('❌')
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="10-digit phone number"
                  value={registerData.phoneNumber}
                  onChange={handleRegisterChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors placeholder-gray-400"
                  maxLength="10"
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors placeholder-gray-400"
                />
              </div>

              {/* Age and GSTIN - Two columns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>Age</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    placeholder="18+"
                    value={registerData.age}
                    onChange={handleRegisterChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors placeholder-gray-400"
                    min="18"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>GSTIN</span>
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    placeholder="15-char GSTIN"
                    value={registerData.gstin}
                    onChange={handleRegisterChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors placeholder-gray-400 uppercase"
                    maxLength="15"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors placeholder-gray-400"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Minimum 6 characters"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>Confirm Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirm(!showRegConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showRegConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:shadow-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Creating Account...' : 'Register as Seller'}</span>
                {!loading && <span>⚡</span>}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account? <button type="button" onClick={() => setAuthTab('login')} className="text-purple-600 font-bold hover:underline">
                  Login here
                </button>
              </p>

              <p className="text-center text-xs text-gray-500 mt-4">
                By registering, you agree to our Terms & Conditions and Privacy Policy
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerAuthPage;

 
