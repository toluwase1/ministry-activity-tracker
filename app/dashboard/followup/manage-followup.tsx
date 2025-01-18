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

interface FollowUpDetail {
  fullName: string
  notes: string
}

interface FollowUpReport {
  id: string
  memberId: string
  memberFullName: string
  activityId: string
  activityName: string
  followUpType: string
  totalFollowUps: number
  notes: string
  date: string
  followUpDetails: FollowUpDetail[]
}

interface FollowUpFilters {
  memberId?: string
  search?: string
  startDate?: string
  endDate?: string
  page: number
  pageSize: number
  sortColumn?: string
  sortOrder?: 'asc' | 'desc'
}

export function ManageFollowUpReports() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [followUpReports, setFollowUpReports] = useState<FollowUpReport[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<FollowUpFilters>({
    page: 1,
    pageSize: 10,
    sortColumn: 'date',
    sortOrder: 'desc'
  })
  const [newReport, setNewReport] = useState({
    memberId: '',
    activityId: '',
    followUpType: 'Teaching',
    totalFollowUps: 0,
    notes: '',
    date: new Date().toISOString(),
    followUpDetails: [{ fullName: '', notes: '' }]
  })
  const [editingReport, setEditingReport] = useState<{
    reportId: string
    memberId: string
    activityId: string
    followUpType: string
    totalFollowUps: number
    notes: string
    date: string
    followUpDetails: FollowUpDetail[]
  } | null>(null)
  const [selectedReport, setSelectedReport] = useState<FollowUpReport | null>(null)

  useEffect(() => {
    if (token) {
      fetchMembers()
      fetchActivities()
      fetchFollowUpReports()
    }
  }, [token, filters])

  const fetchMembers = async () => {
    try {
      const response = await fetch(getApiUrl('Member'), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
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
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        pageSize: filters.pageSize.toString(),
        ...(filters.memberId && { memberId: filters.memberId }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.sortColumn && { sortColumn: filters.sortColumn }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder })
      })

      const response = await fetch(getApiUrl(`FollowupReport?${queryParams}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setFollowUpReports(data.result.items)
        setTotalCount(data.result.totalCount)
      }
    } catch (error) {
      console.error('Error fetching follow-up reports:', error)
      toast.error('Failed to load follow-up reports')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await fetch(getApiUrl('FollowupReport'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(newReport)
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        toast.success('Follow-up report created successfully')
        setNewReport({
          memberId: '',
          activityId: '',
          followUpType: 'Visitation',
          totalFollowUps: 0,
          notes: '',
          date: new Date().toISOString(),
          followUpDetails: [{ fullName: '', notes: '' }]
        })
        await fetchFollowUpReports()
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
      const response = await fetch(getApiUrl('FollowupReport/edit'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(editingReport)
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        toast.success('Follow-up report updated successfully')
        setEditingReport(null)
        setSelectedReport(null)
        await fetchFollowUpReports()
      }
    } catch (error) {
      console.error('Error updating follow-up report:', error)
      toast.error('Failed to update follow-up report')
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
        followUpDetails: [...editingReport.followUpDetails, { fullName: '', notes: '' }]
      })
    } else {
      setNewReport({
        ...newReport,
        followUpDetails: [...newReport.followUpDetails, { fullName: '', notes: '' }]
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
      newDetails[index] = { ...newDetails[index], [field]: value }
      setEditingReport({
        ...editingReport,
        followUpDetails: newDetails
      })
    } else {
      const newDetails = [...newReport.followUpDetails]
      newDetails[index] = { ...newDetails[index], [field]: value }
      setNewReport({
        ...newReport,
        followUpDetails: newDetails
      })
    }
  }

  const handleFilterChange = (field: keyof FollowUpFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
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
              <label className="block text-sm font-medium text-gray-700">Follow-Up Type</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newReport.followUpType}
                onChange={(e) => setNewReport({ ...newReport, followUpType: e.target.value })}
                required
              >
                <option value="Visitation">Visitation</option>
                <option value="Teaching">Teaching</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total Follow-Ups</label>
              <input
                type="number"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newReport.totalFollowUps}
                onChange={(e) => setNewReport({ ...newReport, totalFollowUps: parseInt(e.target.value) })}
                required
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
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={detail.fullName}
                      onChange={(e) => handleFollowUpDetailChange(index, 'fullName', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={detail.notes}
                      onChange={(e) => handleFollowUpDetailChange(index, 'notes', e.target.value)}
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
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.sortColumn}
              onChange={(e) => handleFilterChange('sortColumn', e.target.value)}
            >
              <option value="date">Date</option>
              <option value="memberFullName">Member Name</option>
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
            {followUpReports.map((report) => (
              <li key={report.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.memberFullName}</p>
                    <p className="text-sm text-gray-500">{report.activityName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(report.date).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total Follow-Ups: {report.totalFollowUps}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setEditingReport({
                        reportId: report.id,
                        memberId: report.memberId,
                        activityId: report.activityId,
                        followUpType: report.followUpType,
                        totalFollowUps: report.totalFollowUps,
                        notes: report.notes,
                        date: report.date,
                        followUpDetails: report.followUpDetails
                      })}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
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
                of{' '}
                <span className="font-medium">{totalCount}</span> results
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

        {/* Edit Modal */}
        {editingReport && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Edit Follow-Up Report</h3>
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
                    <label className="block text-sm font-medium text-gray-700">Follow-Up Type</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={editingReport.followUpType}
                      onChange={(e) => setEditingReport({ ...editingReport, followUpType: e.target.value })}
                      required
                    >
                      <option value="Visitation">Visitation</option>
                      <option value="Teaching">Teaching</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Follow-Ups</label>
                    <input
                      type="number"
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={editingReport.totalFollowUps}
                      onChange={(e) => setEditingReport({ ...editingReport, totalFollowUps: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="datetime-local"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={new Date(editingReport.date).toISOString().slice(0, 16)}
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
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={detail.fullName}
                            onChange={(e) => handleFollowUpDetailChange(index, 'fullName', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Notes</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={detail.notes}
                            onChange={(e) => handleFollowUpDetailChange(index, 'notes', e.target.value)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Member Name</p>
                  <p className="text-sm text-gray-900">{selectedReport.memberFullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Activity Name</p>
                  <p className="text-sm text-gray-900">{selectedReport.activityName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Follow-Up Type</p>
                  <p className="text-sm text-gray-900">{selectedReport.followUpType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Date</p>
                  <p className="text-sm text-gray-900">{new Date(selectedReport.date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Follow-Ups</p>
                  <p className="text-sm text-gray-900">{selectedReport.totalFollowUps}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-700">Notes</p>
                  <p className="text-sm text-gray-900">{selectedReport.notes}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-700">Follow-Up Details</p>
                  {selectedReport.followUpDetails.map((detail, index) => (
                    <div key={index} className="border-t pt-2 mt-2">
                      <p className="text-sm text-gray-900">
                        <strong>Full Name:</strong> {detail.fullName}
                      </p>
                      <p className="text-sm text-gray-900">
                        <strong>Notes:</strong> {detail.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}