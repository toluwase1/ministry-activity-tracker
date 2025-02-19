'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getApiUrl } from '../../utils/api-url'
import { handleApiResponse, type ApiResponse } from '../../utils/api-response'
import { toast } from 'sonner'
import LoadingSpinner from '../../components/LoadingSpinner'
import { XMarkIcon } from '@heroicons/react/24/outline'

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

interface AttendanceItem {
  memberId: string
  activityId: string
  isPresent: boolean
  notes: string
  isFirstTimer: boolean
  date: string
  fullName?: string
}

interface AttendanceReport {
  id: string
  memberId: string
  memberName: string
  activityId: string
  activityName: string
  isPresent: boolean
  notes: string
  isFirstTimer: boolean
  date: string
}

interface AttendanceDetails {
  memberId: string
  memberFullName: string
  activityId: string
  activityName: string
  isPresent: boolean
  notes: string
  isFirstTimer: boolean
  date: string
  status: string
  createdBy: string
  modifiedBy: string | null
  createdAt: string
  updatedAt: string | null
  isActive: boolean
  isDeleted: boolean
}

interface FirstTimerForm {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  gender: 'Male' | 'Female'
}

interface AttendanceFilters {
  memberId?: string
  search?: string
  startDate?: string
  endDate?: string
  page: number
  pageSize: number
  sortColumn?: string
  sortOrder?: 'asc' | 'desc'
}

export function ManageAttendance() {
  const { token, userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [attendanceReports, setAttendanceReports] = useState<AttendanceReport[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<AttendanceFilters>({
    page: 1,
    pageSize: 10,
    sortColumn: 'date',
    sortOrder: 'desc'
  })
  const [attendances, setAttendances] = useState<AttendanceItem[]>([{
    memberId: '',
    activityId: '',
    isPresent: true,
    notes: '',
    isFirstTimer: false,
    date: new Date().toISOString()
  }])
  const [showFirstTimerForm, setShowFirstTimerForm] = useState(false)
  const [firstTimerForm, setFirstTimerForm] = useState<FirstTimerForm>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: 'Male'
  })
  const [currentAttendanceIndex, setCurrentAttendanceIndex] = useState<number | null>(null)
  const [selectedReport, setSelectedReport] = useState<AttendanceReport | null>(null)
  const [viewingReport, setViewingReport] = useState<AttendanceDetails | null>(null)

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
        setMembers(Array.isArray(data.result.items) ? data.result.items : [])
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

  const buildQueryString = (params: AttendanceFilters): string => {
    const queryParams = new URLSearchParams()
    
    if (params.memberId) queryParams.append('MemberId', params.memberId)
    if (params.search) queryParams.append('Search', params.search)
    if (params.startDate) queryParams.append('StartDate', params.startDate)
    if (params.endDate) queryParams.append('EndDate', params.endDate)
    if (params.page) queryParams.append('Page', params.page.toString())
    if (params.pageSize) queryParams.append('PageSize', params.pageSize.toString())
    if (params.sortColumn) queryParams.append('SortColumn', params.sortColumn)
    if (params.sortOrder) queryParams.append('SortOrder', params.sortOrder)

    return queryParams.toString()
  }

  const fetchAttendanceReports = async () => {
    try {
      setLoading(true)
      const queryString = buildQueryString(filters)
      const response = await fetch(`${getApiUrl('AttendanceReport')}?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setAttendanceReports(data.result.items)
        setTotalCount(data.result.totalCount)
      }
    } catch (error) {
      console.error('Error fetching attendance reports:', error)
      toast.error('Failed to load attendance reports')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAttendance = () => {
    setAttendances([
      ...attendances,
      {
        memberId: '',
        activityId: '',
        isPresent: true,
        notes: '',
        isFirstTimer: false,
        date: new Date().toISOString()
      }
    ])
  }

  const handleRemoveAttendance = (index: number) => {
    setAttendances(attendances.filter((_, i) => i !== index))
  }

  const handleAttendanceChange = (index: number, field: keyof AttendanceItem, value: any) => {
    const newAttendances = [...attendances]
    newAttendances[index] = {
      ...newAttendances[index],
      [field]: value
    }
    setAttendances(newAttendances)

    // Show first timer form when isFirstTimer is checked
    if (field === 'isFirstTimer' && value === true) {
      setCurrentAttendanceIndex(index)
      setShowFirstTimerForm(true)
    }
  }

  const handleFirstTimerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentAttendanceIndex === null || !userData) return

    try {
      setLoading(true)
      // Create new member
      const createMemberResponse = await fetch(getApiUrl('Member'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...firstTimerForm,
          memberType: 'Member',
          disciplerId: userData.userId,
          fellowshipId: userData.groupId
        })
      })

      const memberData = await createMemberResponse.json()
      if (handleApiResponse(memberData) && createMemberResponse.ok) {
        // Update the attendance with the new member ID
        const newAttendances = [...attendances]
        newAttendances[currentAttendanceIndex] = {
          ...newAttendances[currentAttendanceIndex],
          memberId: memberData.result.id,
          fullName: `${firstTimerForm.firstName} ${firstTimerForm.lastName}`
        }
        setAttendances(newAttendances)
        setShowFirstTimerForm(false)
        setFirstTimerForm({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          gender: 'Male'
        })
        toast.success('First-timer registered successfully')
      }
    } catch (error) {
      console.error('Error creating first-timer:', error)
      toast.error('Failed to register first-timer')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify({
          attendances
        })
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        toast.success('Attendance reports created successfully')
        setAttendances([{
          memberId: '',
          activityId: '',
          isPresent: true,
          notes: '',
          isFirstTimer: false,
          date: new Date().toISOString()
        }])
        await fetchAttendanceReports()
      }
    } catch (error) {
      console.error('Error creating attendance reports:', error)
      toast.error('Failed to create attendance reports')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceReportById = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`AttendanceReport/${id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        const report = data.result
        setSelectedReport(report)
        // setEditingReport({
        //   reportId: id,
        //   memberId: report.memberId,
        //   activityId: report.activityId,
        //   isPresent: report.isPresent,
        //   date: report.date
        // })
      }
    } catch (error) {
      console.error('Error fetching attendance report:', error)
      toast.error('Failed to load attendance report')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceDetails = async (reportId: string) => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`AttendanceReport/${reportId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setViewingReport(data.result)
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error)
      toast.error('Failed to load attendance details')
    } finally {
      setLoading(false)
    }
  }

  const updateAttendanceReport = async (e: React.FormEvent) => {
    e.preventDefault()
    // if (!editingReport) return

    try {
      setLoading(true)
      // const response = await fetch(getApiUrl('AttendanceReport/edit'), {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //     'Accept': 'application/json'
      //   },
      //   body: JSON.stringify(editingReport)
      // })

      // const data = await response.json()
      // if (handleApiResponse(data) && response.ok) {
      //   toast.success('Attendance report updated successfully')
      //   setEditingReport(null)
      //   setSelectedReport(null)
      //   await fetchAttendanceReports()
      // }
    } catch (error) {
      console.error('Error updating attendance report:', error)
      toast.error('Failed to update attendance report')
    } finally {
      setLoading(false)
    }
  }

  const deleteAttendanceReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance report?')) return

    try {
      setLoading(true)
      // const response = await fetch(getApiUrl('AttendanceReport/delete'), {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //     'Accept': 'application/json'
      //   },
      //   body: JSON.stringify({ reportId: id })
      // })

      // const data = await response.json()
      // if (handleApiResponse(data) && response.ok) {
      //   toast.success('Attendance report deleted successfully')
      //   setSelectedReport(null)
      //   await fetchAttendanceReports()
      // }
    } catch (error) {
      console.error('Error deleting attendance report:', error)
      toast.error('Failed to delete attendance report')
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

  useEffect(() => {
    if (token) {
      fetchAttendanceReports()
    }
  }, [token, filters])

  const handleFilterChange = (key: keyof AttendanceFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const totalPages = Math.ceil(totalCount / filters.pageSize)

  if (loading && !attendanceReports.length) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Member</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.memberId || ''}
              onChange={(e) => handleFilterChange('memberId', e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.startDate?.split('T')[0] || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.endDate?.split('T')[0] || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
            />
          </div>
        </div>
      </div>

      {/* Create New Attendance Report Form */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Create New Attendance Report</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {attendances.map((attendance, index) => (
            <div key={index} className="space-y-4">
              <div>
                <label htmlFor="member" className="block text-sm font-medium text-gray-700">
                  Member
                </label>
                <select
                  id="member"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={attendance.memberId}
                  onChange={(e) => handleAttendanceChange(index, 'memberId', e.target.value)}
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
                  value={attendance.activityId}
                  onChange={(e) => handleAttendanceChange(index, 'activityId', e.target.value)}
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
                  value={attendance.date.slice(0, 16)}
                  onChange={(e) => handleAttendanceChange(index, 'date', new Date(e.target.value).toISOString())}
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
                      checked={attendance.isPresent}
                      onChange={(e) => handleAttendanceChange(index, 'isPresent', e.target.checked)}
                    />
                    <span className="ml-2">Present</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Timer
                </label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600"
                      checked={attendance.isFirstTimer}
                      onChange={(e) => handleAttendanceChange(index, 'isFirstTimer', e.target.checked)}
                    />
                    <span className="ml-2">First Timer</span>
                  </label>
                </div>
              </div>

              {attendance.isFirstTimer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Timer Details
                  </label>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={firstTimerForm.firstName}
                      onChange={(e) => setFirstTimerForm({ ...firstTimerForm, firstName: e.target.value })}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={firstTimerForm.lastName}
                      onChange={(e) => setFirstTimerForm({ ...firstTimerForm, lastName: e.target.value })}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={firstTimerForm.email}
                      onChange={(e) => setFirstTimerForm({ ...firstTimerForm, email: e.target.value })}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={firstTimerForm.phoneNumber}
                      onChange={(e) => setFirstTimerForm({ ...firstTimerForm, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={firstTimerForm.gender}
                      onChange={(e) => setFirstTimerForm({ ...firstTimerForm, gender: e.target.value as 'Male' | 'Female' })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={handleAddAttendance}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Attendance
            </button>
          </div>
        </form>
      </div>

      {/* Attendance Reports List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium">Attendance Reports</h2>
          <div className="flex items-center space-x-4">
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.sortColumn}
              onChange={(e) => handleFilterChange('sortColumn', e.target.value)}
            >
              <option value="date">Date</option>
              <option value="memberName">Member Name</option>
              <option value="activityName">Activity Name</option>
            </select>
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
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
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        report.isPresent
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {report.isPresent ? 'Present' : 'Absent'}
                    </span>
                    <button
                      onClick={() => fetchAttendanceDetails(report.id)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => fetchAttendanceReportById(report.id)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAttendanceReport(report.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
              disabled={filters.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
              disabled={filters.page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(filters.page - 1) * filters.pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(filters.page * filters.pageSize, totalCount)}
                </span>{' '}
                of <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Previous
                </button>
                {/* Add page numbers here if needed */}
                <button
                  onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
                  disabled={filters.page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* View Attendance Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Attendance Details</h3>
              <button
                onClick={() => setViewingReport(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Name</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingReport.memberFullName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Activity</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingReport.activityName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(viewingReport.date).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Attendance Status</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingReport.isPresent ? 'Present' : 'Absent'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">First Timer</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingReport.isFirstTimer ? 'Yes' : 'No'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingReport.notes || 'No notes'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">System Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created By</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingReport.createdBy}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(viewingReport.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {viewingReport.modifiedBy && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Modified By</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingReport.modifiedBy}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Updated At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingReport.updatedAt ? new Date(viewingReport.updatedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingReport.status}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Active Status</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {viewingReport.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showFirstTimerForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">First Timer Details</h3>
            <form onSubmit={handleFirstTimerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={firstTimerForm.firstName}
                  onChange={(e) => setFirstTimerForm({ ...firstTimerForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={firstTimerForm.lastName}
                  onChange={(e) => setFirstTimerForm({ ...firstTimerForm, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={firstTimerForm.email}
                  onChange={(e) => setFirstTimerForm({ ...firstTimerForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={firstTimerForm.phoneNumber}
                  onChange={(e) => setFirstTimerForm({ ...firstTimerForm, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={firstTimerForm.gender}
                  onChange={(e) => setFirstTimerForm({ ...firstTimerForm, gender: e.target.value as 'Male' | 'Female' })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowFirstTimerForm(false)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
