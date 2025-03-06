'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getApiUrl } from '../../utils/api-url'
import { handleApiResponse } from '../../utils/api-response'
import { toast } from 'sonner'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  status: string
  disciplerId?: string
}

interface Activity {
  id: string
  name: string
  description: string
  type: string
}

interface FollowUpDetail {
  memberId: string
  discipleId: string
  discipleFullName: string
  activityId: string
  followUpType: string
  fullName: string
  notes: string
  date: string
}

interface FollowUpReport {
  id: string
  memberId: string
  memberFullName: string
  activityId: string
  activityName: string
  totalFollowUps: number
  followUpDetails: FollowUpDetail[]
}

interface FollowUpReportItem {
  id: string
  memberId: string
  memberFullName: string
  activityId: string
  activityName: string
  totalFollowUps: number
}

interface ApiResponse<T> {
  result: {
    items: T[]
    totalCount: number
    totalPages: number
    currentPage: number
    pageSize: number
  }
  success: boolean
  message: string
  validationErrors: string[] | null
}

interface FollowUpFilters {
  startDate?: string
  endDate?: string
  search?: string
  memberId?: string
  page: number
  pageSize: number
  sortColumn: string
  sortOrder: 'asc' | 'desc'
}

export function ManageFollowUpReports() {
  const { token, userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [followUpReports, setFollowUpReports] = useState<FollowUpReport[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<FollowUpFilters>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    page: 1,
    pageSize: 50,
    sortColumn: 'CreatedAt',
    sortOrder: 'desc'
  })
  const [newReport, setNewReport] = useState({
    followUpDetails: [{
      memberId: userData?.userId || '',
      discipleId: '',
      activityId: '',
      followUpType: 'Visitation',
      fullName: 'Select a member to populate name',
      notes: '',
      date: new Date().toISOString()
    }]
  })
  const [editingReport, setEditingReport] = useState<{
    reportId: string
    followUpDetails: {
      memberId: string
      discipleId: string
      activityId: string
      followUpType: string
      fullName: string
      notes: string
      date: string
    }[]
  } | null>(null)
  const [selectedReport, setSelectedReport] = useState<FollowUpReport | null>(null)
  const [followUpDetails, setFollowUpDetails] = useState<FollowUpDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (token && userData?.userId) {
      fetchMembers()
      fetchCurrentMember()
      fetchActivities()
      fetchFollowUpReports()
    }
  }, [token, userData, filters])

  useEffect(() => {
    if (selectedReport?.id) {
      fetchFollowUpDetails(selectedReport.id)
    } else {
      setFollowUpDetails([])
    }
  }, [selectedReport])

  const fetchMembers = async () => {
    if (!token) return

    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: '1',
        pageSize: '100',
        ...(userData?.userType === "WorkersInTraining" && userData?.userId && { disciplerId: userData.userId })
      })

      const response = await fetch(getApiUrl(`Member?${queryParams}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }

      const data = await response.json()
      if (handleApiResponse(data)) {
        setMembers(data.result.items)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentMember = async () => {
    if (!userData?.userId) return
    
    try {
      const response = await fetch(getApiUrl(`Member/${userData.userId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setCurrentMember(data.result)
      }
    } catch (error) {
      console.error('Error fetching current member:', error)
      toast.error('Failed to load member information')
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch(getApiUrl('Activity'), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setActivities(data.result.items.filter((activity: Activity) => activity.type === 'FollowUp'))
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Failed to load activities')
    }
  }

  const fetchFollowUpReports = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      // Always include date range
      queryParams.append('StartDate', filters.startDate || '')
      queryParams.append('EndDate', filters.endDate || '')
      
      // Optional filters
      if (filters.search) queryParams.append('Search', filters.search)
      if (filters.memberId) queryParams.append('MemberId', filters.memberId)
      
      // Add memberId filter for WorkersInTraining users
      if (userData?.userType === "WorkersInTraining" && userData?.userId) {
        queryParams.append('MemberId', userData.userId)
      }
      
      // Pagination and sorting
      queryParams.append('Page', filters.page.toString())
      queryParams.append('PageSize', filters.pageSize.toString())
      queryParams.append('SortColumn', filters.sortColumn)
      queryParams.append('SortOrder', filters.sortOrder)

      console.log('Fetching reports with params:', queryParams.toString()) // Debug log

      const response = await fetch(getApiUrl(`FollowupReport?${queryParams}`), {
        // method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse<FollowUpReport> = await response.json()
      console.log('API Response:', data) // Debug log

      if (data.success) {
        setFollowUpReports(data.result.items)
        setTotalCount(data.result.totalCount)
      } else {
        toast.error(data.message || 'Failed to fetch follow-up reports')
      }
    } catch (error) {
      console.error('Error fetching follow-up reports:', error)
      toast.error('Failed to fetch follow-up reports')
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowUpDetails = async (reportId: string) => {
    setLoadingDetails(true)
    try {
      console.log('Fetching follow-up details for report ID:', reportId)
      const response = await fetch(getApiUrl(`FollowupReport/${reportId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      const data = await response.json()
      console.log('Raw API Response:', data)
      
      if (handleApiResponse(data) && response.ok) {
        // The report comes as an array of follow-up details
        const reportDetails = Array.isArray(data.result) ? data.result : [data.result]
        console.log('Processed report details:', reportDetails)
        
        // Map to our state structure
        const followUpDetails = reportDetails.map((detail: FollowUpDetail) => ({
          memberId: detail.memberId || '',
          discipleId: detail.discipleId || '',
          discipleFullName: detail.discipleFullName || '',
          activityId: detail.activityId || '',
          followUpType: detail.followUpType || 'Visitation',
          fullName: detail.fullName || '',
          notes: detail.notes || '',
          date: detail.date || new Date().toISOString()
        }))
        
        console.log('Mapped follow-up details:', followUpDetails)
        setFollowUpDetails(followUpDetails)
      } else {
        console.error('Failed to fetch follow-up details:', data.message)
        toast.error('Failed to load follow-up details')
      }
    } catch (error) {
      console.error('Error fetching follow-up details:', error)
      toast.error('Failed to load follow-up details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      // Ensure memberId is set to current user's ID and discipleId is set from selected member
      const reportWithIds = {
        followUpDetails: newReport.followUpDetails.map(detail => ({
          ...detail,
          memberId: userData?.userId || '', // Ensure memberId is current user's ID
        }))
      }
      
      console.log('Request payload:', reportWithIds)
      console.log('Current user:', userData)
      
      const response = await fetch(getApiUrl('FollowupReport'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(reportWithIds)
      })
      
      const data = await response.json()

      if (handleApiResponse(data) && response.ok) {
        toast.success('Follow-up report created successfully')
        setNewReport({
          followUpDetails: [{
            memberId: userData?.userId || '',
            discipleId: '',
            activityId: '',
            followUpType: 'Visitation',
            fullName: 'Select a member to populate name',
            notes: '',
            date: new Date().toISOString()
          }]
        })
        await fetchFollowUpReports()
      } else {
        toast.error(data.message || 'Failed to create follow-up report')
      }
    } catch (error) {
      console.error('Error creating follow-up report:', error)
      toast.error('Failed to create follow-up report')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReport) return

    try {
      setLoading(true)
      const followUpDetail = editingReport.followUpDetails[0]
      
      // Ensure the date is in the correct ISO format
      const formattedDate = new Date(followUpDetail.date).toISOString()
      
      // Construct the payload exactly as the API expects
      const payload = {
        reportId: editingReport.reportId,
        memberId: followUpDetail.memberId,
        discipleId: followUpDetail.discipleId,
        activityId: followUpDetail.activityId,
        followUpType: followUpDetail.followUpType,
        fullName: followUpDetail.fullName,
        notes: followUpDetail.notes || '',
        date: formattedDate
      }
      
      console.log('Sending update payload:', payload)
      
      const response = await fetch(getApiUrl(`FollowupReport/edit`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('Update response status:', response.status)
      const data = await response.json()
      console.log('Update response data:', data)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (data.success) {
        toast.success('Report updated successfully')
        setEditingReport(null)
        fetchFollowUpReports()
      } else {
        toast.error(data.message || 'Failed to update report')
      }
    } catch (error) {
      console.error('Error updating report:', error)
      toast.error('Failed to update report')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this follow-up report?')) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl('FollowupReport/delete'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ reportId: id })
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        toast.success('Follow-up report deleted successfully')
        setSelectedReport(null)
        await fetchFollowUpReports()
      }
    } catch (error) {
      console.error('Error deleting follow-up report:', error)
      toast.error('Failed to delete follow-up report')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFollowUpDetail = () => {
    if (editingReport) {
      setEditingReport({
        ...editingReport,
        followUpDetails: [...editingReport.followUpDetails, {
          memberId: '',
          discipleId: '',
          activityId: '',
          followUpType: 'Visitation',
          fullName: 'Select a member to populate name',
          notes: '',
          date: new Date().toISOString()
        }]
      })
    } else {
      setNewReport({
        ...newReport,
        followUpDetails: [...newReport.followUpDetails, {
          memberId: userData?.userId || '',
          discipleId: '',
          activityId: '',
          followUpType: 'Visitation',
          fullName: 'Select a member to populate name',
          notes: '',
          date: new Date().toISOString()
        }]
      })
    }
  }

  const handleRemoveFollowUpDetail = (index: number) => {
    if (editingReport) {
      const newDetails = [...editingReport.followUpDetails]
      newDetails.splice(index, 1)
      setEditingReport({
        ...editingReport,
        followUpDetails: newDetails
      })
    } else {
      const newDetails = [...newReport.followUpDetails]
      newDetails.splice(index, 1)
      setNewReport({
        ...newReport,
        followUpDetails: newDetails
      })
    }
  }

  const handleFollowUpDetailChange = (index: number, field: keyof FollowUpDetail, value: string) => {
    if (editingReport) {
      const newDetails = [...editingReport.followUpDetails]
      if (field === 'memberId') {
        // Find the selected member and update the fullName and discipleId
        const selectedMember = members.find(m => m.id === value)
        if (selectedMember) {
          newDetails[index] = { 
            ...newDetails[index], 
            memberId: userData?.userId || '', // Set memberId to current user's ID
            discipleId: value, // Set discipleId to selected member's ID
            fullName: `${selectedMember.firstName} ${selectedMember.lastName}`
          }
        }
      } else {
        newDetails[index] = { ...newDetails[index], [field]: value }
      }
      setEditingReport({
        ...editingReport,
        followUpDetails: newDetails
      })
    } else {
      const newDetails = [...newReport.followUpDetails]
      if (field === 'memberId') {
        // Find the selected member and update the fullName and discipleId
        const selectedMember = members.find(m => m.id === value)
        if (selectedMember) {
          newDetails[index] = { 
            ...newDetails[index], 
            memberId: userData?.userId || '', // Set memberId to current user's ID
            discipleId: value, // Set discipleId to selected member's ID
            fullName: `${selectedMember.firstName} ${selectedMember.lastName}`
          }
        }
      } else {
        newDetails[index] = { ...newDetails[index], [field]: value }
      }
      setNewReport({
        ...newReport,
        followUpDetails: newDetails
      })
    }
  }

  const handleFilterChange = (field: keyof FollowUpFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field !== 'page' && { page: 1 }) // Reset to first page when changing filters
    }))
  }

  const handleEditReport = async (id: string) => {
    try {
      setLoading(true)
      console.log('Fetching report with ID:', id)

      // First, ensure we have the members list and activities
      if (members.length === 0) {
        await fetchMembers()
      }
      if (activities.length === 0) {
        await fetchActivities()
      }
      
      // Fetch the report details
      const response = await fetch(getApiUrl(`FollowupReport/${id}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      const data = await response.json()
      console.log('API Response:', data)
      
      if (handleApiResponse(data) && response.ok) {
        // The report comes as an array of follow-up details
        const reportDetails = Array.isArray(data.result) ? data.result : [data.result]
        console.log('Raw report details:', reportDetails)
        
        // Get the report details from the response
        const detail = reportDetails[0] // Get the first detail since edit is for single report
        
        // Map to our state structure
        const followUpDetails = [{
          memberId: detail.memberId || '',
          discipleId: detail.discipleId || '',
          activityId: detail.activityId || '',
          followUpType: detail.followUpType || 'Visitation',
          fullName: detail.fullName || '',
          notes: detail.notes || '',
          date: detail.date || new Date().toISOString()
        }]
        
        const editingState = {
          reportId: id, // Use the original ID passed to the function
          followUpDetails
        }
        console.log('Setting editing state:', editingState)
        
        setEditingReport(editingState)
      } else {
        toast.error(data.message || 'Failed to load report details')
      }
    } catch (error) {
      console.error('Error fetching report details:', error)
      toast.error('Failed to load report details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Create New Follow-Up Report Form */}
   
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Create New Follow-Up Report</h2>
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Follow-Up Details</h3>
              <button
                type="button"
                onClick={handleAddFollowUpDetail}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Person
              </button>
            </div>

            {newReport.followUpDetails.map((detail, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Person {index + 1}</h4>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFollowUpDetail(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={detail.discipleId}
                      onChange={(e) => handleFollowUpDetailChange(index, 'memberId', e.target.value)}
                      required
                    >
                      <option value="">Select Member</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Activity</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={detail.activityId}
                      onChange={(e) => handleFollowUpDetailChange(index, 'activityId', e.target.value)}
                      required
                    >
                      <option value="">Select Activity</option>
                      {activities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Follow-Up Type</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={detail.followUpType}
                      onChange={(e) => handleFollowUpDetailChange(index, 'followUpType', e.target.value)}
                      required
                    >
                      <option value="Visitation">Visitation</option>
                      <option value="Teaching">Teaching</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={detail.fullName}
                      readOnly
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={detail.notes}
                      onChange={(e) => handleFollowUpDetailChange(index, 'notes', e.target.value)}
                      placeholder="Enter detailed notes about the follow-up..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="datetime-local"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={new Date(detail.date).toISOString().slice(0, 16)}
                      onChange={(e) => handleFollowUpDetailChange(index, 'date', new Date(e.target.value).toISOString())}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium">Follow-Up Reports</h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search..."
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
            <div className="flex items-center space-x-2">
              <input
                type="date"
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.sortColumn}
              onChange={(e) => handleFilterChange('sortColumn', e.target.value)}
            >
              <option value="1">Date</option>
              <option value="2">Member Name</option>
              <option value="3">Activity Name</option>
              <option value="4">Total Follow-Ups</option>
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Follow-Ups
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {followUpReports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.memberFullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.activityName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.totalFollowUps}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditReport(report.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
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
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handleFilterChange('page', (filters.page - 1).toString())}
              disabled={filters.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => handleFilterChange('page', (filters.page + 1).toString())}
              disabled={filters.page * filters.pageSize >= totalCount}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {Math.min((filters.page - 1) * filters.pageSize + 1, totalCount)}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(filters.page * filters.pageSize, totalCount)}
                </span>{' '}
                of <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handleFilterChange('page', (filters.page - 1).toString())}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleFilterChange('page', (filters.page + 1).toString())}
                  disabled={filters.page * filters.pageSize >= totalCount}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Edit Follow-Up Report</h3>
            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Follow-Up Details</h3>
                  <button
                    type="button"
                    onClick={handleAddFollowUpDetail}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Person
                  </button>
                </div>

                {editingReport.followUpDetails.map((detail, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Person {index + 1}</h4>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFollowUpDetail(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Member</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={detail.discipleId}
                          onChange={(e) => handleFollowUpDetailChange(index, 'memberId', e.target.value)}
                          required
                        >
                          <option value="">Select Member</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.firstName} {member.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Activity</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={detail.activityId}
                          onChange={(e) => handleFollowUpDetailChange(index, 'activityId', e.target.value)}
                          required
                        >
                          <option value="">Select Activity</option>
                          {activities.map((activity) => (
                            <option key={activity.id} value={activity.id}>
                              {activity.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Follow-Up Type</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={detail.followUpType}
                          onChange={(e) => handleFollowUpDetailChange(index, 'followUpType', e.target.value)}
                          required
                        >
                          <option value="Teaching">Teaching</option>
                          <option value="Visitation">Visitation</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={detail.fullName}
                          readOnly
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={detail.notes}
                          onChange={(e) => handleFollowUpDetailChange(index, 'notes', e.target.value)}
                          placeholder="Enter detailed notes about the follow-up..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                          type="datetime-local"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={new Date(detail.date).toISOString().slice(0, 16)}
                          onChange={(e) => handleFollowUpDetailChange(index, 'date', new Date(e.target.value).toISOString())}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Follow-Up Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Member Name</p>
                  <p className="text-sm text-gray-900">{selectedReport.memberFullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Activity Name</p>
                  <p className="text-sm text-gray-900">{selectedReport.activityName}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-700">Total Follow-Ups</p>
                  <p className="text-sm text-gray-900">{selectedReport.totalFollowUps}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-base font-medium mb-4">Follow-Up History</h4>
                {loadingDetails ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Loading follow-up details...</p>
                  </div>
                ) : followUpDetails.length > 0 ? (
                  <div className="space-y-4">
                    {followUpDetails.map((detail, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Follow-Up Type</p>
                            <p className="text-sm text-gray-900">{detail.followUpType}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Disciple Name</p>
                            <p className="text-sm text-gray-900">{detail.discipleFullName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Date</p>
                            <p className="text-sm text-gray-900">{new Date(detail.date).toLocaleString()}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm font-medium text-gray-700">Notes</p>
                            <p className="text-sm text-gray-900">{detail.notes}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No follow-up details found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}