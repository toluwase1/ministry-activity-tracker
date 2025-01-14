'use client'

import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import ProtectedRoute from '../components/ProtectedRoute'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { logout } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <nav className="bg-gray-800 w-64 min-h-screen flex flex-col">
          <div className="flex items-center justify-center h-16 bg-gray-900">
            <span className="text-white font-bold uppercase">Church Dashboard</span>
          </div>
          <ul className="flex-1 px-2">
            <li className="py-2">
              <Link href="/dashboard" className="text-gray-300 hover:text-white block">
                Overview
              </Link>
            </li>
            <li className="py-2">
              <Link href="/dashboard/fellowships" className="text-gray-300 hover:text-white block">
                Fellowships
              </Link>
            </li>
            <li className="py-2">
              <Link href="/dashboard/pastors" className="text-gray-300 hover:text-white block">
                Pastors
              </Link>
            </li>
            <li className="py-2">
              <Link href="/dashboard/members" className="text-gray-300 hover:text-white block">
                Members
              </Link>
            </li>
            <li className="py-2">
              <Link href="/dashboard/outreach" className="text-gray-300 hover:text-white block">
                Outreach Reports
              </Link>
            </li>
            <li className="py-2">
              <Link href="/dashboard/attendance" className="text-gray-300 hover:text-white block">
                Attendance
              </Link>
            </li>
            <li className="py-2">
              <Link href="/dashboard/followup" className="text-gray-300 hover:text-white block">
                Follow-up
              </Link>
            </li>
          </ul>
          <div className="p-4">
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded w-full"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}

