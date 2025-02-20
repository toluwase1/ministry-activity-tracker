'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import DatePicker from 'react-datepicker'
import { getApiUrl } from '../../../utils/api-url'
import { toast } from 'sonner'
import { handleApiResponse } from '../../../utils/api-response'
import "react-datepicker/dist/react-datepicker.css"
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface Activity {
  id: string
  name: string
}

interface Member {
  id: string
  fullName: string
}

interface AttendanceRecord {
  weekStart: string
  weekEnd: string
  activityName: string
  attendance: number
}

interface AttendanceReport {
  [memberName: string]: AttendanceRecord[]
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

  // Function to toggle member expansion
  const toggleMemberExpansion = (memberName: string) => {
    const newExpanded = new Set(expandedMembers)
    if (newExpanded.has(memberName)) {
      newExpanded.delete(memberName)
    } else {
      newExpanded.add(memberName)
    }
    setExpandedMembers(newExpanded)
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [activitiesRes, membersRes] = await Promise.all([
          fetch(getApiUrl('Activity'), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }),
          fetch(getApiUrl('Member'), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          })
        ])

        const activitiesData = await activitiesRes.json()
        const membersData = await membersRes.json()

        if (activitiesRes.ok && activitiesData.success) {
          setActivities(activitiesData.result.items || [])
        }
        if (membersRes.ok && membersData.success) {
          console.log('Members data:', membersData.result)
          setMembers(membersData.result.items || [])
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
        toast.error('Failed to load initial data')
      }
    }
    
    if (token) {
      fetchInitialData()
    }
  }, [token])

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
      if (userData?.groupId) {
        queryParams.append('FellowshipId', userData.groupId)
      }

      const response = await fetch(getApiUrl(`StandardReport/attendance-report?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setReportData(data.result)
        // Clear expanded members when new data loads
        setExpandedMembers(new Set())
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
      if (userData?.groupId) {
        queryParams.append('FellowshipId', userData.groupId)
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholderText="Select start date"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholderText="Select end date"
              dateFormat="yyyy-MM-dd"
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
              {members && members.map((member) => (
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

      {reportData && Object.keys(reportData).length > 0 ? (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Attendance Results</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(reportData).map(([memberName, records]) => (
                <div key={memberName} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleMemberExpansion(memberName)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
                  >
                    <span className="text-lg font-medium text-gray-900">{memberName}</span>
                    {expandedMembers.has(memberName) ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedMembers.has(memberName) && (
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Week
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Activity
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Attendance
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {records.map((record, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(record.weekStart).toLocaleDateString()} - {new Date(record.weekEnd).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {record.activityName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    record.attendance > 0
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {record.attendance > 0 ? 'Present' : 'Absent'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
