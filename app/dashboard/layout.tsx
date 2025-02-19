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
    {
      href: '/dashboard/pastors',
      label: 'Pastors',
      allowedRoles: ['Pastor']
    },
    {
      href: '/dashboard/members',
      label: 'Members',
      allowedRoles: ['Pastor']
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
          <div className="flex items-center justify-center h-16 bg-gray-900">
            <span className="text-white font-bold uppercase">Church Dashboard</span>
            {/* Debug info */}
            {userData && (
              <div className="text-xs text-gray-400 mt-1">
                Logged in as: {userData.userType}
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
