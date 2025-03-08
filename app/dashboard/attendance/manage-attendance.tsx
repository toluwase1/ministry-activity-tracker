import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getApiUrl } from '../../utils/api-url'
import { toast } from 'sonner'
import LoadingSpinner from '../../components/LoadingSpinner'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface Member {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  disciplerId: string
}

interface AttendanceItem {
  memberId: string
  fullName: string
  isPresent: boolean
  isFirstTimer?: boolean
  notes?: string
}

interface WorkerAttendance {
  isPresent: boolean
  notes?: string
}

interface Activity {
  id: string
  name: string
  description?: string
  status: string
}

interface AttendanceReport {
  id: string
  memberId: string
  memberFullName: string
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

type MemberType = 'Disciple'
type Gender = 'Male' | 'Female'

interface FirstTimerFormUI {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  gender: Gender
}

interface FirstTimerForm extends FirstTimerFormUI {
  memberType: MemberType
}

interface AttendanceFilters {
  memberId?: string
  disciplerId?: string
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
  const [members, setMembers] = useState<Member[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]) // Initialize with current date
  const [attendances, setAttendances] = useState<AttendanceItem[]>([])
  const [showFirstTimerForm, setShowFirstTimerForm] = useState(false)
  const [firstTimerForm, setFirstTimerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: 'Male' as Gender,
  })
  const [attendanceReports, setAttendanceReports] = useState<AttendanceReport[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<AttendanceFilters>({
    page: 1,
    pageSize: 10,
  })
  const [viewingReport, setViewingReport] = useState<AttendanceReport | null>(null)
  const [editingReport, setEditingReport] = useState<AttendanceReport | null>(null)
  const [workerAttendance, setWorkerAttendance] = useState<WorkerAttendance>({
    isPresent: false,
    notes: ''
  })

  // Fetch members assigned to the logged-in worker
  const fetchMembers = async () => {
    if (!token || !userData) return

    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        disciplerId: userData.userId
      })

      const response = await fetch(getApiUrl(`Member?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        const assignedMembers = data.result.items || []
        setMembers(assignedMembers)
        
        // Initialize attendance records for all members
        const initialAttendances = assignedMembers.map((member: Member) => ({
          memberId: member.id,
          fullName: `${member.firstName} ${member.lastName}`,
          isPresent: false
        }))
        setAttendances(initialAttendances)
      } else {
        toast.error(data.message || 'Failed to load members')
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  // Fetch available activities
  const fetchActivities = async () => {
    if (!token) return

    try {
      const response = await fetch(getApiUrl('Activity'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setActivities(data.result.items || [])
      } else {
        toast.error(data.message || 'Failed to load activities')
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
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        pageSize: filters.pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.memberId && { memberId: filters.memberId }),
        // ...(userData?.userId && { disciplerId: userData.userId }),
        ...(userData?.userType === "WorkersInTraining" && userData?.userId && { disciplerId: userData.userId })
      })

      const response = await fetch(getApiUrl(`AttendanceReport?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      console.log('Attendance Reports:', data) // Add this log
      if (response.ok && data.success) {
        setAttendanceReports(data.result.items)
        setTotalCount(data.result.totalCount)
      } else {
        toast.error(data.message || 'Failed to fetch attendance reports')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to fetch attendance reports')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAttendance = () => {
    setAttendances([
      ...attendances,
      {
        memberId: '',
        fullName: '',
        isPresent: false
      }
    ])
  }

  const handleRemoveAttendance = (index: number) => {
    setAttendances(attendances.filter((_, i) => i !== index))
  }

  const handleAttendanceChange = (index: number, field: keyof AttendanceItem, value: any) => {
    const newAttendances = [...attendances]
    if (field === 'isPresent') {
      newAttendances[index] = {
        ...newAttendances[index],
        [field]: value,
        notes: value ? "" : newAttendances[index].notes // Clear notes if marked as present
      }
    } else {
      newAttendances[index] = {
        ...newAttendances[index],
        [field]: value
      }
    }
    setAttendances(newAttendances)

    // Show first timer form when isFirstTimer is checked
    if (field === 'isFirstTimer' && value === true) {
      setShowFirstTimerForm(true)
    }
  }

  const handleFirstTimerChange = (field: keyof FirstTimerFormUI, value: string) => {
    setFirstTimerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFirstTimerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return

    try {
        setLoading(true)

        const requestBody = {
            firstName: firstTimerForm.firstName,
            lastName: firstTimerForm.lastName,
            email: firstTimerForm.email,
            phoneNumber: firstTimerForm.phoneNumber,
            gender: firstTimerForm.gender,
            memberType: "Disciple",
            disciplerId: userData.userId,
            fellowshipId: userData.groupId
        }

        console.log('Creating new member:', requestBody)

        const response = await fetch(getApiUrl('Member'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })

        const data = await response.json()
        console.log('Member creation response:', data)

        // Always show API message (whether success or failure)
        toast[data.success ? 'success' : 'error'](data.message || 'Operation completed')

        // Stop execution if request failed or validation errors exist
        if (!data.success || (data.validationErrors && data.validationErrors.length > 0)) {
            const errorMessage = data.validationErrors?.length > 0 
                ? data.validationErrors.join(', ') 
                : data.message || 'Failed to save first timer'
            
            console.error('Validation errors:', errorMessage)
            toast.error(errorMessage)
            return
        }

        // Ensure result exists before accessing .id
        if (data.success && data.result) {
            const newMemberId = data.result.id || null
            const fullName = `${firstTimerForm.firstName} ${firstTimerForm.lastName}`

            if (!newMemberId) {
                console.error("Error: API did not return member ID.")
                toast.error("Error: Could not retrieve member ID from server.")
                return
            }

            // Refresh the members list immediately
            await fetchMembers()

            // Then update the attendance entry with the new member's ID and full name
            const newAttendances = [...attendances]
            newAttendances[0] = {
                ...newAttendances[0],
                memberId: newMemberId,
                fullName: fullName
            }
            setAttendances(newAttendances)

            // Reset form and close modal
            setShowFirstTimerForm(false)
            setFirstTimerForm({
                firstName: '',
                lastName: '',
                email: '',
                phoneNumber: '',
                gender: 'Male' as Gender,
            })
        } else {
            console.error("Error: No result returned from API.")
            toast.error("Error: Unexpected response. No user data found.")
        }

    } catch (error) {
        console.error('Error creating first timer:', error)
        toast.error('Network error: Failed to save first timer')
    } finally {
        setLoading(false)
    }
}

  const handleWorkerAttendanceChange = (field: keyof WorkerAttendance, value: any) => {
    setWorkerAttendance(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Validate activity selection
      if (!selectedActivity) {
        toast.error('Please select an activity')
        return
      }

      // Validate date selection
      if (!selectedDate) {
        toast.error('Please select a date')
        return
      }

      // Check for absent members without notes
      const absentMembersWithoutNotes = attendances
        .filter(att => att.memberId && !att.isPresent && (!att.notes || att.notes.trim() === ''))
        .map(att => att.fullName)

      if (absentMembersWithoutNotes.length > 0) {
        toast.error(`Please provide reason for absence for: ${absentMembersWithoutNotes.join(', ')}`)
        return
      }

      // Check for worker's absence without notes
      if (!workerAttendance.isPresent && (!workerAttendance.notes || workerAttendance.notes.trim() === '')) {
        toast.error('Please provide reason for your absence')
        return
      }

      // Format the date to ISO string with the selected date
      const selectedDateTime = new Date(selectedDate)
      selectedDateTime.setHours(12) // Set to noon to avoid timezone issues
      const formattedDate = selectedDateTime.toISOString()

      // Prepare worker's attendance record
      const workerRecord = {
        memberId: userData?.userId || '',
        activityId: selectedActivity,
        isPresent: workerAttendance.isPresent,
        isFirstTimer: false,
        notes: workerAttendance.notes || "",
        date: formattedDate
      }

      // Prepare attendance records for all members
      const attendanceRecords = attendances
        .filter(att => att.memberId) // Include all members
        .map(att => ({
          memberId: att.memberId,
          activityId: selectedActivity,
          isPresent: att.isPresent,
          isFirstTimer: att.isFirstTimer || false,
          notes: att.notes || "", // Include notes for absent members
          date: formattedDate
        }))

      // Combine worker's record with members' records
      const allAttendanceRecords = [workerRecord, ...attendanceRecords]

      if (allAttendanceRecords.length === 0) {
        toast.error('No attendance records to submit')
        return
      }

      const payload = {
        attendances: allAttendanceRecords
      }
      console.log('=== Attendance Submission ===')
      console.log('Request URL:', getApiUrl('AttendanceReport'))
      console.log('Request Headers:', {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
      console.log('Request Payload:', JSON.stringify(payload, null, 2))

      const response = await fetch(getApiUrl('AttendanceReport'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('Response Status:', response.status)
      const data = await response.json()
      console.log('Response Data:', data)
      
      if (response.ok && data.success) {
        toast.success(data.message || 'Attendance submitted successfully')
        
        // Reset form
        setSelectedActivity('')
        setSelectedDate(new Date().toISOString().split('T')[0])
        setWorkerAttendance({ isPresent: false, notes: '' })
        await fetchMembers()
      } else {
        // Handle validation errors
        if (data.validationErrors && data.validationErrors.length > 0) {
          data.validationErrors.forEach((error: string) => {
            toast.error(error)
          })
        } else {
          toast.error(data.message || 'Failed to submit attendance')
        }
      }
    } catch (error) {
      console.error('Error submitting attendance:', error)
      toast.error('Failed to submit attendance')
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
      if (response.ok) {
        const report = data.result
        setViewingReport(report)
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
      if (response.ok) {
        setViewingReport(data.result)
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error)
      toast.error('Failed to load attendance details')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof AttendanceFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleViewReport = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`AttendanceReport/${id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setViewingReport(data.result)
      } else {
        toast.error(data.message || 'Failed to load attendance report')
      }
    } catch (error) {
      console.error('Error viewing report:', error)
      toast.error('Failed to load attendance report')
    } finally {
      setLoading(false)
    }
  }

  const handleEditReport = async (id: string) => {
    try {
      setLoading(true)
      console.log('Editing report with ID:', id)
      const report = attendanceReports.find(r => r.id === id)
      if (report) {
        setEditingReport(report)
      } else {
        toast.error('Report not found')
      }
    } catch (error) {
      console.error('Error loading report for edit:', error)
      toast.error('Failed to load attendance report')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance report?')) {
      return
    }

    try {
      setLoading(true)
      console.log('Deleting report with ID:', id)

      const response = await fetch(getApiUrl('AttendanceReport/delete'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ reportId: id })
      })

      const data = await response.json()
      console.log('Delete Response:', {
        status: response.status,
        ok: response.ok,
        data
      })

      if (response.ok && data.success) {
        toast.success(data.message || 'Attendance report deleted successfully')
        await fetchAttendanceReports() // Refresh the list
      } else {
        toast.error(data.message || 'Failed to delete attendance report')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast.error('Failed to delete attendance report')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReport) return

    try {
      setLoading(true)
      console.log('Editing Report Object:', editingReport) // Log the full report object
      
      const payload = {
        reportId: editingReport.id,
        memberId: editingReport.memberId,
        activityId: editingReport.activityId,
        isPresent: editingReport.isPresent,
        date: editingReport.date
      }

      console.log('Edit Request Payload:', {
        url: getApiUrl('AttendanceReport/edit'),
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        payload
      })

      const response = await fetch(getApiUrl('AttendanceReport/edit'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('Edit Response:', {
        status: response.status,
        ok: response.ok,
        data
      })

      if (response.ok && data.success) {
        toast.success(data.message || 'Attendance report updated successfully')
        setEditingReport(null)
        await fetchAttendanceReports() // Refresh the list
      } else {
        toast.error(data.message || 'Failed to update attendance report')
      }
    } catch (error) {
      console.error('Error updating report:', error)
      toast.error('Failed to update attendance report')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / filters.pageSize)

  useEffect(() => {
    if (token && userData) {
      fetchActivities()
      fetchMembers()
      fetchAttendanceReports()
    }
  }, [token, userData])

  useEffect(() => {
    if (token) {
      fetchAttendanceReports()
    }
  }, [token, filters])

  if (loading && !attendances.length) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Attendance Creation Section */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Attendance</h2>
        
        {/* Step 1: Activity Selection */}
        <div className="space-y-6 mt-4">
          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-gray-700">
              Select Activity
            </label>
            <select
              id="activity"
              name="activity"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
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
              Attendance Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
            />
          </div>
        </div>

        {/* Step 2: Member Attendance */}
        {selectedActivity && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Mark Attendance</h3>
              <button
                type="button"
                onClick={() => setShowFirstTimerForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add First Timer
              </button>
            </div>

            {/* Worker's Attendance Section */}
            <div className="mb-8 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="text-lg font-medium text-indigo-900 mb-4">Your Attendance</h4>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-indigo-600"
                    checked={workerAttendance.isPresent}
                    onChange={(e) => handleWorkerAttendanceChange('isPresent', e.target.checked)}
                  />
                  <span className="ml-2 text-indigo-900">Present</span>
                </label>
                {!workerAttendance.isPresent && (
                  <input
                    type="text"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Reason for absence"
                    value={workerAttendance.notes || ''}
                    onChange={(e) => handleWorkerAttendanceChange('notes', e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Members' Attendance Section */}
            <div className="mt-4 space-y-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Members' Attendance</h4>
              {attendances.map((attendance, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-grow">
                    <p className="font-medium">{attendance.fullName}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-indigo-600"
                        checked={attendance.isPresent}
                        onChange={(e) => handleAttendanceChange(index, 'isPresent', e.target.checked)}
                      />
                      <span className="ml-2">Present</span>
                    </label>
                    {!attendance.isPresent && (
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Reason for absence"
                        value={attendance.notes || ''}
                        onChange={(e) => handleAttendanceChange(index, 'notes', e.target.value)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedActivity || loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {loading ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Reports Section */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Attendance Reports</h2>
        
        {/* Filters */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Filters</h3>
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

        {/* Reports Table */}
        <div className="mt-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceReports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.memberFullName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.activityName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(report.date).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        report.isPresent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {report.isPresent ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewReport(report.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditReport(report.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handleFilterChange('page', filters.page - 1)}
                disabled={filters.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page >= totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{filters.page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    disabled={filters.page >= totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* First Timer Modal */}
      {showFirstTimerForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add First Timer</h3>
            <form onSubmit={handleFirstTimerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={firstTimerForm.firstName}
                  onChange={(e) => setFirstTimerForm({ ...firstTimerForm, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={firstTimerForm.lastName}
                  onChange={(e) => setFirstTimerForm({ ...firstTimerForm, lastName: e.target.value })}
                  required
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
                  type="tel"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={firstTimerForm.phoneNumber}
                  onChange={(e) => setFirstTimerForm({ ...firstTimerForm, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={firstTimerForm.gender}
                  onChange={(e) => setFirstTimerForm({ ...firstTimerForm, gender: e.target.value as Gender })}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="mt-5 sm:mt-6 space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? 'Saving...' : 'Save First Timer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFirstTimerForm(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">View Attendance Report</h3>
              <button
                onClick={() => setViewingReport(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Member</label>
                <div className="mt-1 text-sm text-gray-900">{viewingReport.memberFullName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Activity</label>
                <div className="mt-1 text-sm text-gray-900">{viewingReport.activityName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(viewingReport.date).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    viewingReport.isPresent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingReport.isPresent ? 'Present' : 'Absent'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">First Timer</label>
                <div className="mt-1 text-sm text-gray-900">
                  {viewingReport.isFirstTimer ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <div className="mt-1 text-sm text-gray-900">
                  {viewingReport.notes || 'No notes'}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Attendance Report</h3>
              <button
                onClick={() => setEditingReport(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Member</label>
                <div className="mt-1 text-sm text-gray-900">{editingReport.memberFullName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Activity</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={editingReport.activityId}
                  onChange={(e) => setEditingReport(prev => ({ ...prev!, activityId: e.target.value }))}
                  required
                >
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                <input
                  type="datetime-local"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={editingReport.date.split('.')[0]} // Remove milliseconds
                  onChange={(e) => setEditingReport(prev => ({ ...prev!, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600"
                      checked={editingReport.isPresent}
                      onChange={(e) => setEditingReport(prev => ({ ...prev!, isPresent: e.target.checked }))}
                    />
                    <span className="ml-2">Present</span>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
