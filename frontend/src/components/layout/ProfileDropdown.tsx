// src/components/layout/ProfileDropdown.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Mail, Github, Linkedin, Globe, ArrowLeft, Loader2, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  profileRef: React.RefObject<HTMLButtonElement>;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, profileRef }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, login, logout } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsSigningIn(false);
      setEmail('');
      setPassword('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current?.contains(event.target as Node)) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, profileRef]);

  const handleClose = () => {
    setIsSigningIn(false);
    setEmail('');
    setPassword('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-64 bg-white text-gray-900 rounded-lg shadow-2xl border border-gray-200 p-3 space-y-3 animate-in slide-in-from-top-2 z-[1000]"
    >
      {user ? (
        <div className="space-y-3">
          <div className="px-1 py-1">
            <div className="flex justify-between items-start">
              <div className="truncate pr-2">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name || user.username}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-bold ${user.is_superuser ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {user.is_superuser ? 'Administrator' : 'Member'}
              </span>
            </div>
          </div>
          
          <div className="border-t border-gray-100 my-2" />
          
          <Link
            href="/dashboard"
            onClick={handleClose}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200"
          >
            <LayoutDashboard className="w-4 h-4 text-blue-500" />
            Dashboard
          </Link>

          <div className="border-t border-gray-100 mt-3 pt-2">
            <button
              onClick={() => {
                logout();
                handleClose();
              }}
              className="block w-full py-2 px-4 bg-red-50 text-red-600 rounded-md text-center font-semibold hover:bg-red-100 transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <>
          {!isSigningIn ? (
            <div className="grid grid-cols-4 gap-2">
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_ADMIN_EMAIL || '{{ADMIN_EMAIL}}'}?subject=Hey%20there!`}
                className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
                title="Send Email"
              >
                <Mail className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </a>
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_URL || '{{GITHUB_URL}}'}
                className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
              >
                <Github className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </a>
              <a
                href={process.env.NEXT_PUBLIC_LINKEDIN_URL || '{{LINKEDIN_URL}}'}
                className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </a>
              <a
                href={process.env.NEXT_PUBLIC_WEBSITE_URL || '{{WEBSITE_URL}}'}
                className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                title="Website"
              >
                <Globe className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </a>
            </div>
          ) : null}

          {!isSigningIn ? (
            <div className="space-y-2">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/oauth/google`}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 bg-white hover:border-gray-400 transition-colors duration-200"
              >
                <img src="/icons/google.svg" alt="Google icon" className="h-4 w-4" />
                Sign in with Google
              </a>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/oauth/github`}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 bg-white hover:border-gray-400 transition-colors duration-200"
              >
                <Github className="h-4 w-4" />
                Sign in with GitHub
              </a>
            </div>
          ) : null}

          {!isSigningIn ? (
            <button
              onClick={() => setIsSigningIn(true)}
              className="block w-full py-2 px-4 bg-gray-900 text-white rounded-md text-center hover:bg-gray-800 transition-colors duration-200"
            >
              Sign In
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2" onClick={(e) => e.stopPropagation()} autoComplete="on">
              <input
                name="dropdown_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                required
                disabled={isLoading}
              />
              <input
                name="dropdown_password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                required
                disabled={isLoading}
              />
              {error ? <p className="text-xs text-red-500">{error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSigningIn(false);
                    setError('');
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 flex items-center gap-1"
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-1 disabled:bg-gray-400"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default ProfileDropdown;
