'use client'

import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import ProtectedRoute from '../components/ProtectedRoute'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface NavItem {
  href: string
  label: string
  allowedRoles: string[]
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { logout, userData } = useAuth()
  const pathname = usePathname()
  
  // Debug user type
  useEffect(() => {
    if (userData) {
      console.log('Current user type:', userData.userType)
      console.log('Full user data:', userData)
    }
  }, [userData])
  
  const navigationItems: NavItem[] = [
    {
      href: '/dashboard/reports',
      label: 'Reports',
      allowedRoles: ['Pastor']
    },
    {
      href: '/dashboard',
      label: 'Overview',
      allowedRoles: ['Pastor', 'WorkersInTraining']
    },
    {
      href: '/dashboard/fellowships',
      label: 'Fellowships',
      allowedRoles: ['Pastor']
    },
    // {
    //   href: '/dashboard/pastors',
    //   label: 'Pastors',
    //   allowedRoles: ['Pastor']
    // },
    {
      href: '/dashboard/members',
      label: 'Members',
      allowedRoles: ['Pastor', 'WorkersInTraining']
    },
    {
      href: '/dashboard/outreach',
      label: 'Outreach Reports',
      allowedRoles: ['Pastor', 'WorkersInTraining']
    },
    {
      href: '/dashboard/attendance',
      label: 'Attendance',
      allowedRoles: ['Pastor', 'WorkersInTraining']
    },
    {
      href: '/dashboard/followup',
      label: 'Follow-up',
      allowedRoles: ['Pastor', 'WorkersInTraining']
    }
  ]

  const isAuthorized = (allowedRoles: string[]) => {
    if (!userData) return false
    // Debug authorization check
    console.log('Checking authorization for path:', allowedRoles, 'User type:', userData.userType)
    return allowedRoles.includes(userData.userType)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <nav className="bg-gray-800 w-64 min-h-screen flex flex-col">
          <div className="bg-gray-900 p-4">
            <div className="text-white font-bold uppercase mb-4">Church Dashboard</div>
            {userData && (
              <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="bg-indigo-500 rounded-full p-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white">{userData.fullName}</span>
                </div>
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{userData.emailAddress}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{userData.phoneNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{userData.groupName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="px-2 py-1 text-xs font-medium bg-indigo-500 text-white rounded-full">
                      {userData.userType}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <ul className="flex-1 px-2">
            {navigationItems.map((item) => {
              const authorized = isAuthorized(item.allowedRoles)
              console.log(`Menu item ${item.label}: authorized=${authorized}`)
              return authorized ? (
                <li key={item.href} className="py-2">
                  <Link 
                    href={item.href} 
                    className={`block px-4 py-2 rounded-md ${
                      pathname === item.href
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ) : null
            })}
          </ul>
          <div className="p-4">
            <button
              onClick={logout}
              className="w-full px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-8 bg-gray-100">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
