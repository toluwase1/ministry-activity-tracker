'use client'

import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import DatePicker from 'react-datepicker'
import { getApiUrl } from '../../../utils/api-url'
import { toast } from 'sonner'
import { handleApiResponse } from '../../../utils/api-response'

interface Activity {
  id: string
  name: string
}

interface Member {
  id: string
  fullName: string
}

interface AttendanceRecord {
  date: string
  memberId: string
  memberName: string
  isPresent: boolean
}

interface AttendanceReport {
  activityId: string
  activityName: string
  records: AttendanceRecord[]
}

export function AttendanceReport() {
  const { token, userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    return lastWeek
  })
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [memberId, setMemberId] = useState('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [reportData, setReportData] = useState<AttendanceReport | null>(null)
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set())

  const toggleMemberExpansion = (memberId: string) => {
    const newSet = new Set(expandedMembers)
    if (newSet.has(memberId)) {
      newSet.delete(memberId)
    } else {
      newSet.add(memberId)
    }
    setExpandedMembers(newSet)
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch(getApiUrl('Activity'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setActivities(data.result.items)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Failed to load activities')
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(getApiUrl('Member'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setMembers(data.result.items)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      if (startDate) {
        queryParams.append('StartDate', startDate.toISOString().split('T')[0])
      }
      if (endDate) {
        queryParams.append('EndDate', endDate.toISOString().split('T')[0])
      }
      if (selectedActivities.length > 0) {
        queryParams.append('ActivityIds', selectedActivities.join(','))
      }
      if (memberId) {
        queryParams.append('MemberId', memberId)
      }

      const response = await fetch(getApiUrl(`StandardReport/attendance-report?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setReportData(data.result)
        toast.success('Report generated successfully')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleExportToExcel = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      if (startDate) {
        queryParams.append('StartDate', startDate.toISOString().split('T')[0])
      }
      if (endDate) {
        queryParams.append('EndDate', endDate.toISOString().split('T')[0])
      }
      if (selectedActivities.length > 0) {
        queryParams.append('ActivityIds', selectedActivities.join(','))
      }
      if (memberId) {
        queryParams.append('MemberId', memberId)
      }

      const response = await fetch(getApiUrl(`StandardReport/attendance-report/export?${queryParams}`), {
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
      a.download = 'attendance-report.xlsx'
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Generate Attendance Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholderText="Select start date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholderText="Select end date"
            />
          </div>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {loading ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {reportData && reportData.records && reportData.records.length > 0 ? (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Attendance Results</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.records.map((record, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.memberName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.isPresent
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.isPresent ? 'Present' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : reportData ? (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <p className="text-gray-500 text-center">
            No attendance records found for the selected criteria.
          </p>
        </div>
      ) : null}
    </div>
  )
}
