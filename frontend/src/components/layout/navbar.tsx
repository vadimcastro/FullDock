// src/components/layout/navbar.tsx
'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import AdminMenu from './AdminMenu';

export default function Navbar() {
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileButtonRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="bg-white/60 md:bg-white/80 backdrop-blur-sm shadow-none md:shadow-sm border-b border-gray-50 md:border-gray-200">
      <div className="w-full px-2 md:px-4">
        <div className="flex justify-between h-14 sm:h-12 items-center">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-lg sm:text-xl ml-2 md:ml-4">
{process.env.NEXT_PUBLIC_PROJECT_NAME || 'Template Project'}
            </Link>
          </div>
          <div className="flex items-center">
            <Link href="/dashboard" className="hover:text-gray-600 transition-colors duration-200 px-2 sm:px-4 md:px-6 text-sm sm:text-base">
              Dashboard
            </Link>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors duration-200 px-2 sm:px-4 md:px-6 text-sm sm:text-base"
            >
              API Docs
            </a>
            {user ? (
              <AdminMenu />
            ) : (
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={toggleDropdown}
                  className="flex items-center hover:opacity-80 transition-opacity duration-200 pl-2 sm:pl-4 md:pl-6"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                </button>
                <ProfileDropdown
                  isOpen={isDropdownOpen}
                  onClose={() => setIsDropdownOpen(false)}
                  profileRef={profileButtonRef}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
