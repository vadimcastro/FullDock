// src/components/layout/ProfileDropdown.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Github, Linkedin, Globe, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  profileRef: React.RefObject<HTMLButtonElement>;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, profileRef }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current?.contains(event.target as Node)) {
        return;
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
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

  useEffect(() => {
    if (isSigningIn) {
      setError('');
    }
  }, [isSigningIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      handleClose();
    } catch (error) {
      console.error('Login submission error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Unable to connect to the server. Please try again.'
      );
    } finally {
      setIsLoading(false);  // Ensure loading state is always cleared
    }
  };


  if (!isOpen || !mounted) return null;

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed right-4 top-16 w-64 bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-200 p-3 space-y-3 animate-in slide-in-from-top-2"
      style={{ 
        zIndex: 2147483647,
        position: 'fixed',
        isolation: 'isolate'
      }}
    >
      {!isSigningIn ? (
        <>
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

          <button
            onClick={() => {
              setIsSigningIn(true);
            }}
            className="block w-full py-2 px-4 bg-gray-900 text-white rounded-md text-center hover:bg-gray-800 transition-colors duration-200"
          >
            Sign In
          </button>
        </>
      ) : (
        <form 
          onSubmit={handleSubmit} 
          className="space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white/50"
              required
            />
          </div>
          <div className="space-y-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white/50"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsSigningIn(false);
              }}
              disabled={isLoading}
              className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-1.5 px-4 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gray-900 hover:bg-gray-800'
              } text-white rounded-md transition-colors duration-200 flex items-center justify-center gap-2`}
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
    </div>
  );

  return createPortal(dropdownContent, document.body);
};

export default ProfileDropdown;