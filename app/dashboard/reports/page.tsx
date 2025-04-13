'use client'

import { useState } from 'react'
import { AttendanceReport } from './components/attendance-report'
import { AnalysisReport } from './components/analysis-report'
import { PerformanceAnalysis } from './components/performance-analysis'
import RoleBasedRoute from '../../components/RoleBasedRoute'

type ReportType = 'attendance' | 'analysis' | 'performance'

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('attendance')

  return (
    <RoleBasedRoute allowedRoles={['Pastor']}>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Reports Dashboard</h1>
          <div className="mt-4 sm:mt-0">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setActiveReport('attendance')}
                className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                  activeReport === 'attendance'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Attendance Reports
              </button>
              <button
                type="button"
                onClick={() => setActiveReport('analysis')}
                className={`relative -ml-px inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                  activeReport === 'analysis'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Analysis Reports
              </button>
              <button
                type="button"
                onClick={() => setActiveReport('performance')}
                className={`relative -ml-px inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                  activeReport === 'performance'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Performance Analysis
              </button>
            </div>
          </div>
        </div>

        {activeReport === 'attendance' ? (
          <AttendanceReport />
        ) : activeReport === 'analysis' ? (
          <AnalysisReport />
        ) : (
          <PerformanceAnalysis />
        )}
      </div>
    </RoleBasedRoute>
  )
}