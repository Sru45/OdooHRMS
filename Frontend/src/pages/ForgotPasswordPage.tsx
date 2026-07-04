import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import { AlertTriangle, Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { Logo } from '../components/ui/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    
    const result = await resetPassword(email, newPassword);
    
    setIsLoading(false);
    if (result.success) {
      toast.success('Password reset successfully! Please sign in with your new password.');
      navigate('/sign-in');
    } else {
      setError(result.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
            <Logo />
          </div>
          <div className="w-12 h-12 bg-accent-600/10 text-accent-500 rounded-full flex items-center justify-center mb-4">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-white mt-2">Reset Password</h1>
          <p className="text-sm text-center text-surface-400 mt-1.5">
            Enter your email address and a new secure password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-surface-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              disabled={isLoading}
              className="w-full h-10 bg-surface-900 border border-white/15 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 disabled:opacity-50 transition-colors"
              placeholder="e.g. employee@novatech.com"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-surface-400 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setError(''); }}
              disabled={isLoading}
              className="w-full h-10 bg-surface-900 border border-white/15 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 disabled:opacity-50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm pt-1">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-accent-600 hover:bg-accent-500 active:bg-accent-700 text-white font-medium rounded-lg mt-2 transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/sign-in" className="text-sm text-surface-400 hover:text-white transition-colors">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
