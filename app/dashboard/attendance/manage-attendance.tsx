'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getApiUrl } from '../../utils/api-url'
import { handleApiResponse, type ApiResponse } from '../../utils/api-response'
import { toast } from 'sonner'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  status: string
}

interface Activity {
  id: string
  name: string
  description: string
  type: string
}

interface AttendanceReport {
  id: string
  memberId: string
  memberName: string
  activityId: string
  activityName: string
  isPresent: boolean
  date: string
}

export function ManageAttendance() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [attendanceReports, setAttendanceReports] = useState<AttendanceReport[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newReport, setNewReport] = useState({
    memberId: '',
    activityId: '',
    isPresent: true,
    date: new Date().toISOString()
  })

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
        // Filter only attendance type activities
        const attendanceActivities = data.result.items.filter(
          (activity: Activity) => activity.type === 'Attendance'
        )
        setActivities(attendanceActivities)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Failed to load activities')
    }
  }

  const fetchAttendanceReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl('AttendanceReport'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setAttendanceReports(data.result.items)
      }
    } catch (error) {
      console.error('Error fetching attendance reports:', error)
      toast.error('Failed to load attendance reports')
    } finally {
      setLoading(false)
    }
  }

  const createAttendanceReport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await fetch(getApiUrl('AttendanceReport'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newReport)
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        toast.success('Attendance report created successfully')
        setNewReport({
          memberId: '',
          activityId: '',
          isPresent: true,
          date: new Date().toISOString()
        })
        await fetchAttendanceReports()
      }
    } catch (error) {
      console.error('Error creating attendance report:', error)
      toast.error('Failed to create attendance report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchMembers()
      fetchActivities()
      fetchAttendanceReports()
    }
  }, [token])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Create New Attendance Report Form */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Create New Attendance Report</h2>
        <form onSubmit={createAttendanceReport} className="space-y-4">
          <div>
            <label htmlFor="member" className="block text-sm font-medium text-gray-700">
              Member
            </label>
            <select
              id="member"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={newReport.memberId}
              onChange={(e) => setNewReport({ ...newReport, memberId: e.target.value })}
              required
            >
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-gray-700">
              Activity
            </label>
            <select
              id="activity"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={newReport.activityId}
              onChange={(e) => setNewReport({ ...newReport, activityId: e.target.value })}
              required
            >
              <option value="">Select an activity</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="datetime-local"
              id="date"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={newReport.date.slice(0, 16)} // Format date for datetime-local input
              onChange={(e) => setNewReport({ ...newReport, date: new Date(e.target.value).toISOString() })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Attendance Status
            </label>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-indigo-600"
                  checked={newReport.isPresent}
                  onChange={(e) => setNewReport({ ...newReport, isPresent: e.target.checked })}
                />
                <span className="ml-2">Present</span>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Attendance Reports List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium">Attendance Reports</h2>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {attendanceReports.map((report) => (
              <li key={report.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.memberName}</p>
                    <p className="text-sm text-gray-500">{report.activityName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(report.date).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.isPresent
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {report.isPresent ? 'Present' : 'Absent'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
