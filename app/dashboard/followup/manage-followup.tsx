'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

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
  followUpDetails: {
    fullName: string
    notes: string
  }[]
}

interface Member {
  id: string
  fullName: string
}

interface Activity {
  id: string
  name: string
}

interface FollowUpFilters {
  page: number
  pageSize: number
  sortColumn: string
  sortOrder: string
  memberId?: string
  search?: string
  startDate?: string
  endDate?: string
}

const getApiUrl = (path: string) => `https://attendancesystem-2gjw.onrender.com/api/${path}`

export function ManageFollowUp() {
  const { user } = useAuth()
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
  const [newReport, setNewReport] = useState<Partial<FollowUpReport>>({
    followUpDetails: [],
    followUpType: 'Visitation',
    totalFollowUps: 0,
    date: new Date().toISOString().split('T')[0]
  })
  const [editingReport, setEditingReport] = useState<FollowUpReport | null>(null)
  const [selectedReport, setSelectedReport] = useState<FollowUpReport | null>(null)

  const fetchMembers = async () => {
    try {
      const response = await fetch(getApiUrl('Member'), {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const data = await response.json()
      if (data.success) {
        setMembers(data.result.items)
      } else {
        throw new Error(data.message || 'Failed to fetch members')
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch(getApiUrl('Activity'), {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Accept': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      const data = await response.json()
      if (data.success) {
        setActivities(data.result.items)
      } else {
        throw new Error(data.message || 'Failed to fetch activities')
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
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
          'Authorization': `Bearer ${user.token}`,
          'Accept': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch follow-up reports')
      }
      const data = await response.json()
      if (data.success) {
        setFollowUpReports(data.result.items)
        setTotalCount(data.result.totalCount)
      } else {
        throw new Error(data.message || 'Failed to fetch follow-up reports')
      }
    } catch (error) {
      console.error('Error fetching follow-up reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowUpReportById = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`FollowupReport/${id}`), {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Accept': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch follow-up report')
      }
      const data = await response.json()
      if (data.success) {
        setSelectedReport(data.result)
      } else {
        throw new Error(data.message || 'Failed to fetch follow-up report')
      }
    } catch (error) {
      console.error('Error fetching follow-up report:', error)
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
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newReport)
      })
      if (!response.ok) {
        throw new Error('Failed to create follow-up report')
      }
      await fetchFollowUpReports()
      setNewReport({ 
        followUpDetails: [],
        followUpType: 'Visitation',
        totalFollowUps: 0,
        date: new Date().toISOString().split('T')[0]
      })
      toast({
        title: "Success",
        description: "Follow-up report created successfully"
      })
    } catch (error) {
      console.error('Error creating follow-up report:', error)
      toast({
        title: "Error",
        description: 'Error creating follow-up report: ' + error.message,
        variant: "destructive"
      })
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
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(editingReport)
      })
      if (!response.ok) {
        throw new Error('Failed to update follow-up report')
      }
      await fetchFollowUpReports()
      setEditingReport(null)
    } catch (error) {
      console.error('Error updating follow-up report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this followup report?')) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl('FollowupReport/delete'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ reportId: id })
      })
      if (!response.ok) {
        throw new Error('Failed to delete follow-up report')
      }
      await fetchFollowUpReports()
    } catch (error) {
      console.error('Error deleting follow-up report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
    fetchActivities()
  }, [user?.token])

  useEffect(() => {
    fetchFollowUpReports()
  }, [filters, user?.token])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Follow-up Report</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateReport} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Member Full Name"
                value={newReport.memberFullName || ''}
                onChange={(e) => setNewReport({...newReport, memberFullName: e.target.value})}
                required
              />
              <Input
                placeholder="Activity Name"
                value={newReport.activityName || ''}
                onChange={(e) => setNewReport({...newReport, activityName: e.target.value})}
                required
              />
              <Select 
                value={newReport.followUpType} 
                onValueChange={(value) => setNewReport({...newReport, followUpType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Follow-up Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visitation">Visitation</SelectItem>
                  <SelectItem value="Phone Call">Phone Call</SelectItem>
                  <SelectItem value="Text Message">Text Message</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Total Follow-ups"
                value={newReport.totalFollowUps || ''}
                onChange={(e) => setNewReport({...newReport, totalFollowUps: parseInt(e.target.value)})}
                min="0"
                required
              />
            </div>
            <Textarea
              placeholder="Notes"
              value={newReport.notes || ''}
              onChange={(e) => setNewReport({...newReport, notes: e.target.value})}
              className="min-h-[100px]"
            />
            <Input
              type="date"
              value={newReport.date || ''}
              onChange={(e) => setNewReport({...newReport, date: e.target.value})}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Follow-up Report
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {followUpReports.map((report) => (
          <Card key={report.id}>
            <CardContent className="pt-6">
              {editingReport && editingReport.id === report.id ? (
                <form onSubmit={handleUpdateReport} className="space-y-4">
                  <Input
                    value={editingReport.memberFullName}
                    onChange={(e) => setEditingReport({...editingReport, memberFullName: e.target.value})}
                    required
                  />
                  <Input
                    value={editingReport.activityName}
                    onChange={(e) => setEditingReport({...editingReport, activityName: e.target.value})}
                    required
                  />
                  <Select 
                    value={editingReport.followUpType} 
                    onValueChange={(value) => setEditingReport({...editingReport, followUpType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Follow-up Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Teaching">Teaching</SelectItem>
                      <SelectItem value="Visitation">Visitation</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={editingReport.totalFollowUps}
                    onChange={(e) => setEditingReport({...editingReport, totalFollowUps: parseInt(e.target.value)})}
                    min="0"
                    required
                  />
                  <Textarea
                    value={editingReport.notes}
                    onChange={(e) => setEditingReport({...editingReport, notes: e.target.value})}
                    className="min-h-[100px]"
                  />
                  <Input
                    type="date"
                    value={editingReport.date}
                    onChange={(e) => setEditingReport({...editingReport, date: e.target.value})}
                    required
                  />
                  <div className="flex space-x-2">
                    <Button type="submit" variant="default">Save</Button>
                    <Button onClick={() => setEditingReport(null)} variant="outline">Cancel</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">{report.memberFullName}</h3>
                  <div className="text-sm text-muted-foreground">
                    <p>Activity: {report.activityName}</p>
                    <p>Follow-up Type: {report.followUpType}</p>
                    <p>Total Follow-ups: {report.totalFollowUps}</p>
                    <p>Date: {new Date(report.date).toLocaleDateString()}</p>
                    <p className="mt-2">Notes: {report.notes}</p>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button onClick={() => setEditingReport(report)} variant="outline" size="sm">Edit</Button>
                    <Button onClick={() => handleDeleteReport(report.id)} variant="destructive" size="sm">Delete</Button>
                    <Button onClick={() => fetchFollowUpReportById(report.id)} variant="secondary" size="sm">View Details</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Edit Follow-up Report</h3>
            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Member</label>
                  <select
                    value={editingReport?.memberId}
                    onChange={(e) => setEditingReport(prev => ({ ...prev!, memberId: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Activity</label>
                  <select
                    value={editingReport?.activityId}
                    onChange={(e) => setEditingReport(prev => ({ ...prev!, activityId: e.target.value }))}
                    className="w-full p-2 border rounded"
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
                  <label className="block text-sm font-medium mb-1">Follow-up Type</label>
                  <select
                    value={editingReport?.followUpType}
                    onChange={(e) => setEditingReport(prev => ({ ...prev!, followUpType: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="Teaching">Teaching</option>
                    <option value="Visitation">Visitation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Total Follow-ups</label>
                  <input
                    type="number"
                    value={editingReport?.totalFollowUps}
                    onChange={(e) => setEditingReport(prev => ({ ...prev!, totalFollowUps: parseInt(e.target.value) }))}
                    className="w-full p-2 border rounded"
                    min="0"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={editingReport?.notes}
                    onChange={(e) => setEditingReport(prev => ({ ...prev!, notes: e.target.value }))}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="datetime-local"
                    value={editingReport ? new Date(editingReport.date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingReport(prev => ({ ...prev!, date: new Date(e.target.value).toISOString() }))}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Follow-up Details</h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingReport) {
                        setEditingReport(prev => ({ ...prev!, followUpDetails: [...prev!.followUpDetails, { fullName: '', notes: '' }] }))
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Person
                  </button>
                </div>

                {editingReport?.followUpDetails.map((detail, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Person {index + 1}</h4>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (editingReport) {
                              setEditingReport(prev => ({ ...prev!, followUpDetails: prev!.followUpDetails.filter((_, i) => i !== index) }))
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
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
                          onChange={(e) => {
                            if (editingReport) {
                              setEditingReport(prev => ({ ...prev!, followUpDetails: prev!.followUpDetails.map((d, i) => i === index ? { ...d, fullName: e.target.value } : d) }))
                            }
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={detail.notes}
                          onChange={(e) => {
                            if (editingReport) {
                              setEditingReport(prev => ({ ...prev!, followUpDetails: prev!.followUpDetails.map((d, i) => i === index ? { ...d, notes: e.target.value } : d) }))
                            }
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingReport(null)
                    setSelectedReport(null)
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedReport && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Follow-up Report Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Member</p>
                  <p className="text-muted-foreground">{selectedReport.memberFullName}</p>
                </div>
                <div>
                  <p className="font-medium">Activity</p>
                  <p className="text-muted-foreground">{selectedReport.activityName}</p>
                </div>
                <div>
                  <p className="font-medium">Follow-up Type</p>
                  <p className="text-muted-foreground">{selectedReport.followUpType}</p>
                </div>
                <div>
                  <p className="font-medium">Total Follow-ups</p>
                  <p className="text-muted-foreground">{selectedReport.totalFollowUps}</p>
                </div>
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-muted-foreground">{new Date(selectedReport.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="font-medium">Notes</p>
                <p className="text-muted-foreground">{selectedReport.notes}</p>
              </div>
              <div>
                <p className="font-medium mb-2">Follow-up Details</p>
                <div className="space-y-2">
                  {selectedReport.followUpDetails.map((detail, index) => (
                    <div key={index} className="p-3 bg-muted rounded">
                      <p className="font-medium">{detail.fullName}</p>
                      <p className="text-muted-foreground">{detail.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => setSelectedReport(null)} variant="outline">Close</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
