'use client'

import { MemberReports } from './member-reports'

export default function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports Dashboard</h1>
      <MemberReports />
    </div>
  )
}