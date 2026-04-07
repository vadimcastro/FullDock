// src/app/reset-password/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) setToken(tokenParam);
  }, []);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/reset-password-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to request reset');
      }

      setIsSubmitted(true);
      toast({
        title: "Reset link sent",
        description: "If an account exists with this email, you'll receive reset instructions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/reset-password-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to reset password');
      }

      setIsSubmitted(true);
      toast({
        title: "Password reset successful",
        description: "You can now sign in with your new password.",
      });
    } catch (error) {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="card space-y-6 p-8">
          {!isSubmitted && !token ? (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold">Reset Password</h1>
                <p className="text-gray-600 mt-2">
                  Enter your email address to receive reset instructions.
                </p>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : !isSubmitted && token ? (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold">Set New Password</h1>
                <p className="text-gray-600 mt-2">
                  Enter your new password to complete reset.
                </p>
              </div>

              <form onSubmit={handleConfirmSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                    New password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-mint-600">{token ? 'Password Updated' : 'Check Your Email'}</h2>
              <p className="mt-2 text-gray-600">
                {token
                  ? 'Your password was reset successfully. You can now return and sign in.'
                  : "If an account exists with this email, you'll receive instructions to reset your password."}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
