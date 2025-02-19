'use client'

import { MemberReports } from './member-reports'
import RoleBasedRoute from '../../components/RoleBasedRoute'

export default function ReportsPage() {
  return (
    <RoleBasedRoute allowedRoles={['Pastor']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Reports Dashboard</h1>
        <MemberReports />
      </div>
    </RoleBasedRoute>
  )
}