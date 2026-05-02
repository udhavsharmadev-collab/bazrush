'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Phone, Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';

const PhoneAuthModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { login } = useAuth();

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep('phone');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  const goBack = () => {
    setError('');
    setPassword('');
    setConfirmPassword('');
    setStep('phone');
  };

  const handlePhoneSubmit = async () => {
    if (!phone.match(/^\d{10}$/)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fullPhone = '+91' + phone;
      const res = await fetch(`/api/users/${encodeURIComponent(fullPhone)}`);

      if (res.ok) {
        const user = await res.json();
        if (user.password) {
          setStep('password');
        } else {
          setStep('create-password');
        }
      } else if (res.status === 404) {
        // New user — create them first
        await fetch(`/api/users/${encodeURIComponent(fullPhone)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: fullPhone,
            name: '', age: '', email: '',
            address: '', lat: 20.5937, lng: 78.9629,
            cart: [], orders: [],
          }),
        });
        setStep('create-password');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fullPhone = '+91' + phone;
      const res = await fetch(`/api/users/${encodeURIComponent(fullPhone)}`);
      const user = await res.json();

      if (user.password !== password) {
        setError('Incorrect password');
        return;
      }

      await login(fullPhone);
      resetAndClose();
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fullPhone = '+91' + phone;

      // Use PATCH on [phone] route directly — no set-password needed
      const res = await fetch(`/api/users/${encodeURIComponent(fullPhone)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to set password. Try again.');
        return;
      }

      await login(fullPhone);
      resetAndClose();
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">

        {/* Header */}
        <div className="pt-8 px-8 pb-6 border-b border-gray-100">
          <button
            type="button"
            onClick={step === 'phone' ? resetAndClose : goBack}
            className="p-2 -m-2 rounded-2xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="mt-4 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              {step === 'phone' && <Phone className="w-10 h-10 text-white" />}
              {step === 'password' && <Lock className="w-10 h-10 text-white" />}
              {step === 'create-password' && <CheckCircle className="w-10 h-10 text-white" />}
            </div>

            {step === 'phone' && (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
                <p className="text-gray-500 text-sm">Enter your mobile number to continue</p>
              </>
            )}
            {step === 'password' && (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
                <p className="text-gray-500 text-sm">+91 {phone}</p>
              </>
            )}
            {step === 'create-password' && (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Password</h2>
                <p className="text-gray-500 text-sm">+91 {phone}</p>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-5">

          {step === 'phone' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-lg font-medium text-gray-500">+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
                  placeholder="9123456789"
                  className="w-full pl-20 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                  maxLength={10}
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 'password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>
          )}

          {step === 'create-password' && (
            <>
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Account Ready</p>
                <p className="text-sm font-semibold text-gray-800">+91 {phone}</p>
                <p className="text-xs text-purple-600 mt-1">Set a password to secure your account.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePassword()}
                    placeholder="Re-enter password"
                    className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={
              step === 'phone' ? handlePhoneSubmit :
              step === 'password' ? handlePasswordLogin :
              handleCreatePassword
            }
            disabled={
              loading ||
              (step === 'phone' && !phone) ||
              (step === 'password' && !password) ||
              (step === 'create-password' && (!password || !confirmPassword))
            }
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Please wait...</span>
              </div>
            ) : step === 'phone' ? 'Continue' :
              step === 'password' ? 'Sign In' :
              'Set Password & Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneAuthModal;