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
}

interface Activity {
  id: string
  name: string
  description: string
  type: string
}

interface OutreachDetail {
  fullName: string
  address: string
  phoneNumber: string
}

interface OutreachReport {
  id: string
  memberId: string
  memberName: string
  activityId: string
  activityName: string
  totalPeopleReached: number
  notes: string
  date: string
  outreachDetails: OutreachDetail[]
}

interface OutreachFilters {
  memberId?: string
  search?: string
  startDate?: string
  endDate?: string
  page: number
  pageSize: number
  sortColumn?: string
  sortOrder?: 'asc' | 'desc'
}

export function ManageOutreachReports() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [outreachReports, setOutreachReports] = useState<OutreachReport[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const { userData } = useAuth()
  const [filters, setFilters] = useState<OutreachFilters>({
    page: 1,
    pageSize: 10,
    sortColumn: 'date',
    sortOrder: 'desc'
  })
  const [newReport, setNewReport] = useState({
    memberId: '',
    activityId: '',
    totalPeopleReached: 0,
    notes: '',
    date: new Date().toISOString(),
    outreachDetails: [{ fullName: '', address: '', phoneNumber: '' }]
  })
  const [editingReport, setEditingReport] = useState<{
    reportId: string
    memberId: string
    activityId: string
    totalPeopleReached: number
    notes: string
    date: string
    outreachDetails: OutreachDetail[]
  } | null>(null)
  const [selectedReport, setSelectedReport] = useState<OutreachReport | null>(null)

  const fetchMembers = async () => {
    try {
        const response = await fetch(getApiUrl('Member'), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        if (handleApiResponse(data) && response.ok) {
            // Set members to the 'items' array from the API response
            setMembers(Array.isArray(data.result.items) ? data.result.items : []);
        }
    } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to load members');
    }
};

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
          (activity: Activity) => activity.type === 'Outreach'
        )
        setActivities(attendanceActivities)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Failed to load activities')
    }
  }

  const fetchOutreachReports = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        pageSize: filters.pageSize.toString(),
        ...(filters.memberId && { memberId: filters.memberId }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.sortColumn && { sortColumn: filters.sortColumn }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      
        // Add memberId filter for WorkersInTraining users
        ...(userData?.userType === "WorkersInTraining" && userData?.userId && { memberId: userData.userId })
      })

      //  // Add memberId filter for WorkersInTraining users
      //  if (userData?.userType === "WorkersInTraining" && userData?.userId) {
      //   queryParams.append('disciplerId', userData.userId)
      // }

      const response = await fetch(getApiUrl(`OutreachReport?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setOutreachReports(data.result.items)
        setTotalCount(data.result.totalCount)
      }
    } catch (error) {
      console.error('Error fetching outreach reports:', error)
      toast.error('Failed to load outreach reports')
    } finally {
      setLoading(false)
    }
  }

  const fetchOutreachReportById = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`OutreachReport/${id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        const report = data.result
        setSelectedReport(report)
        setEditingReport({
          reportId: id,
          memberId: report.memberId,
          activityId: report.activityId,
          totalPeopleReached: report.totalPeopleReached,
          notes: report.notes,
          date: report.date,
          outreachDetails: report.outreachDetails
        })
      }
    } catch (error) {
      console.error('Error fetching outreach report:', error)
      toast.error('Failed to load outreach report')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await fetch(getApiUrl('OutreachReport'), {
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
        toast.success('Outreach report created successfully')
        setNewReport({
          memberId: '',
          activityId: '',
          totalPeopleReached: 0,
          notes: '',
          date: new Date().toISOString(),
          outreachDetails: [{ fullName: '', address: '', phoneNumber: '' }]
        })
        await fetchOutreachReports()
      }
    } catch (error) {
      console.error('Error creating outreach report:', error)
      toast.error('Failed to create outreach report')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReport) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl('OutreachReport/edit'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(editingReport)
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        toast.success('Outreach report updated successfully')
        setEditingReport(null)
        setSelectedReport(null)
        await fetchOutreachReports()
      }
    } catch (error) {
      console.error('Error updating outreach report:', error)
      toast.error('Failed to update outreach report')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outreach report?')) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl('OutreachReport/delete'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ reportId: id })
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        toast.success('Outreach report deleted successfully')
        setSelectedReport(null)
        await fetchOutreachReports()
      }
    } catch (error) {
      console.error('Error deleting outreach report:', error)
      toast.error('Failed to delete outreach report')
    } finally {
      setLoading(false)
    }
  }

  const handleAddOutreachDetail = () => {
    if (editingReport) {
      setEditingReport({
        ...editingReport,
        outreachDetails: [...editingReport.outreachDetails, { fullName: '', address: '', phoneNumber: '' }],
        totalPeopleReached: editingReport.outreachDetails.length + 1
      })
    } else {
      setNewReport({
        ...newReport,
        outreachDetails: [...newReport.outreachDetails, { fullName: '', address: '', phoneNumber: '' }],
        totalPeopleReached: newReport.outreachDetails.length + 1
      })
    }
  }

  const handleRemoveOutreachDetail = (index: number) => {
    if (editingReport) {
      const newDetails = [...editingReport.outreachDetails]
      newDetails.splice(index, 1)
      setEditingReport({
        ...editingReport,
        outreachDetails: newDetails,
        totalPeopleReached: newDetails.length
      })
    } else {
      const newDetails = [...newReport.outreachDetails]
      newDetails.splice(index, 1)
      setNewReport({
        ...newReport,
        outreachDetails: newDetails,
        totalPeopleReached: newDetails.length
      })
    }
  }

  const handleOutreachDetailChange = (index: number, field: keyof OutreachDetail, value: string) => {
    if (editingReport) {
      const newDetails = [...editingReport.outreachDetails]
      newDetails[index] = { ...newDetails[index], [field]: value }
      setEditingReport({
        ...editingReport,
        outreachDetails: newDetails
      })
    } else {
      const newDetails = [...newReport.outreachDetails]
      newDetails[index] = { ...newDetails[index], [field]: value }
      setNewReport({
        ...newReport,
        outreachDetails: newDetails
      })
    }
  }

  const handleFilterChange = (field: keyof OutreachFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  useEffect(() => {
    if (token) {
      fetchMembers()
      fetchActivities()
      fetchOutreachReports()
    }
  }, [token, filters])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Create New Report Form */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Create New Outreach Report</h2>
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Member</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newReport.memberId}
                onChange={(e) => setNewReport({ ...newReport, memberId: e.target.value })}
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
                value={newReport.activityId}
                onChange={(e) => setNewReport({ ...newReport, activityId: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700">Total People Reached</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newReport.outreachDetails.length}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="datetime-local"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={new Date(newReport.date).toISOString().slice(0, 16)}
                onChange={(e) => setNewReport({ ...newReport, date: new Date(e.target.value).toISOString() })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={newReport.notes}
              onChange={(e) => setNewReport({ ...newReport, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Outreach Details</h3>
              <button
                type="button"
                onClick={handleAddOutreachDetail}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Person
              </button>
            </div>

            {newReport.outreachDetails.map((detail, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Person {index + 1}</h4>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOutreachDetail(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={detail.fullName}
                      onChange={(e) => handleOutreachDetailChange(index, 'fullName', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={detail.address}
                      onChange={(e) => handleOutreachDetailChange(index, 'address', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={detail.phoneNumber}
                      onChange={(e) => handleOutreachDetailChange(index, 'phoneNumber', e.target.value)}
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

      {/* Filters */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search reports..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium">Outreach Reports</h2>
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
            {outreachReports.map((report) => (
              <li key={report.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.memberName}</p>
                    <p className="text-sm text-gray-500">{report.activityName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(report.date).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      People Reached: {report.totalPeopleReached}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                      <button
                        onClick={() => fetchOutreachReportById(report.id)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
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
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
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
            <h3 className="text-lg font-medium mb-4">Edit Outreach Report</h3>
            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingReport.memberId}
                    onChange={(e) => setEditingReport({ ...editingReport, memberId: e.target.value })}
                    required
                  >
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
                    value={editingReport.activityId}
                    onChange={(e) => setEditingReport({ ...editingReport, activityId: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700">Total People Reached</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingReport.totalPeopleReached}
                    onChange={(e) => setEditingReport({ ...editingReport, totalPeopleReached: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingReport.date.slice(0, 16)}
                    onChange={(e) => setEditingReport({ ...editingReport, date: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={editingReport.notes}
                  onChange={(e) => setEditingReport({ ...editingReport, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Outreach Details</h3>
                  <button
                    type="button"
                    onClick={handleAddOutreachDetail}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Person
                  </button>
                </div>

                {editingReport.outreachDetails.map((detail, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Person {index + 1}</h4>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOutreachDetail(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={detail.fullName}
                          onChange={(e) => handleOutreachDetailChange(index, 'fullName', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={detail.address}
                          onChange={(e) => handleOutreachDetailChange(index, 'address', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input
                          type="tel"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={detail.phoneNumber}
                          onChange={(e) => handleOutreachDetailChange(index, 'phoneNumber', e.target.value)}
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
                  onClick={() => {
                    setEditingReport(null)
                    setSelectedReport(null)
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
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

                {/* View Modal */}
          {selectedReport && (
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4"
              tabIndex={-1}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSelectedReport(null);
              }}
            >
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Outreach Report Details</h3>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Member Name</p>
                    <p className="text-sm text-gray-900">{selectedReport.memberName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Activity Name</p>
                    <p className="text-sm text-gray-900">{selectedReport.activityName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Date</p>
                    <p className="text-sm text-gray-900">{new Date(selectedReport.date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total People Reached</p>
                    <p className="text-sm text-gray-900">{selectedReport.totalPeopleReached}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Notes</p>
                    <p className="text-sm text-gray-900">{selectedReport.notes}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Outreach Details</p>
                    {selectedReport.outreachDetails?.length ? (
                      selectedReport.outreachDetails.map((detail, index) => (
                        <div key={index} className="border-t pt-2 mt-2">
                          <p className="text-sm text-gray-900">
                            <strong>Full Name:</strong> {detail.fullName}
                          </p>
                          <p className="text-sm text-gray-900">
                            <strong>Address:</strong> {detail.address}
                          </p>
                          <p className="text-sm text-gray-900">
                            <strong>Phone Number:</strong> {detail.phoneNumber}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No outreach details available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

    </div>
  )
}
