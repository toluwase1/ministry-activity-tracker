'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import DatePicker from 'react-datepicker'
import { getApiUrl } from '../../../utils/api-url'
import { toast } from 'sonner'
import "react-datepicker/dist/react-datepicker.css"
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

interface Activity {
  id: string
  name: string
}

interface Member {
  id: string
  firstName: string
  lastName: string
}

interface PerformanceMetrics {
  activity: string
  totalCount: number
  attendanceCount: number
  outreachCount: number
  followUpCount: number
  period: string
}

type SummaryType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'

export function PerformanceAnalysis() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    return lastMonth
  })
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [summaryType, setSummaryType] = useState<SummaryType>('weekly')
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(10)
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([])

  useEffect(() => {
    if (token) {
      fetchActivities()
      fetchMembers()
    }
  }, [token])

  const fetchActivities = async () => {
    try {
      const queryParams = new URLSearchParams({
        pageSize: '200',
        page: '1',
        sortColumn: 'name',
        sortOrder: 'asc'
      })

      const response = await fetch(getApiUrl(`Activity?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        // Sort activities alphabetically by name
        const sortedActivities = (data.result.items || []).sort((a: Activity, b: Activity) => 
          a.name.localeCompare(b.name)
        )
        setActivities(sortedActivities)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Failed to load activities')
    }
  }

  const fetchMembers = async () => {
    try {
      const queryParams = new URLSearchParams({
        pageSize: '200',
        page: '1',
        sortColumn: 'firstName',
        sortOrder: 'asc'
      })

      const response = await fetch(getApiUrl(`Member?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        // Sort members alphabetically by firstName
        const sortedMembers = (data.result.items || []).sort((a: Member, b: Member) => 
          a.firstName.localeCompare(b.firstName)
        )
        setMembers(sortedMembers)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    }
  }

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }

    if (selectedActivities.length === 0) {
      toast.error('Please select at least one activity')
      return
    }

    try {
      setLoading(true)
      
      const queryParams = new URLSearchParams()
      queryParams.append('StartDate', startDate.toISOString().split('T')[0])
      queryParams.append('EndDate', endDate.toISOString().split('T')[0])
      queryParams.append('ActivityIds', selectedActivities.join(','))
      queryParams.append('SummaryType', summaryType)
      
      if (summaryType === 'custom') {
        queryParams.append('CustomIntervalDays', customIntervalDays.toString())
      }
      
      if (selectedMember) {
        queryParams.append('MemberId', selectedMember)
      }

      const response = await fetch(getApiUrl(`Analytics/performance-analysis?${queryParams.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setPerformanceData(data.result)
        toast.success('Performance analysis generated successfully')
      } else {
        toast.error(data.message || 'Failed to generate performance analysis')
      }
    } catch (error) {
      console.error('Error generating performance analysis:', error)
      toast.error('Failed to generate performance analysis')
    } finally {
      setLoading(false)
    }
  }

  const handleExportToExcel = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      queryParams.append('StartDate', startDate?.toISOString().split('T')[0] || '')
      queryParams.append('EndDate', endDate?.toISOString().split('T')[0] || '')
      queryParams.append('ActivityIds', selectedActivities.join(','))
      queryParams.append('SummaryType', summaryType)
      
      if (summaryType === 'custom') {
        queryParams.append('CustomIntervalDays', customIntervalDays.toString())
      }
      
      if (selectedMember) {
        queryParams.append('MemberId', selectedMember)
      }

      const response = await fetch(getApiUrl(`Analytics/performance-analysis/export?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'performance-analysis.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export report')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDateSelect = (period: string) => {
    const today = new Date()
    
    switch (period) {
      case 'last7days':
        setStartDate(addDays(today, -7))
        setEndDate(today)
        break
      case 'last30days':
        setStartDate(addDays(today, -30))
        setEndDate(today)
        break
      case 'thisWeek':
        setStartDate(startOfWeek(today))
        setEndDate(endOfWeek(today))
        break
      case 'thisMonth':
        setStartDate(startOfMonth(today))
        setEndDate(endOfMonth(today))
        break
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Select
            </label>
            <select
              onChange={(e) => handleQuickDateSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select period...</option>
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="thisWeek">This week</option>
              <option value="thisMonth">This month</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activities
            </label>
            <select
              multiple
              value={selectedActivities}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value)
                setSelectedActivities(values)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member (Optional)
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">All Members</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary Type
            </label>
            <select
              value={summaryType}
              onChange={(e) => setSummaryType(e.target.value as SummaryType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {summaryType === 'custom' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Interval (Days)
            </label>
            <input
              type="number"
              value={customIntervalDays}
              onChange={(e) => setCustomIntervalDays(parseInt(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? 'Generating...' : 'Generate Analysis'}
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={loading || performanceData.length === 0}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {performanceData.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Performance Analysis Results</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outreach
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Follow-up
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.activity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.totalCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.attendanceCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.outreachCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.followUpCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
