'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

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

export function ManageFollowUp() {
  const { user } = useAuth()
  const [followUpReports, setFollowUpReports] = useState<FollowUpReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingReport, setEditingReport] = useState<FollowUpReport | null>(null)
  const [newReport, setNewReport] = useState<Partial<FollowUpReport>>({
    followUpDetails: []
  })
  const [selectedReport, setSelectedReport] = useState<FollowUpReport | null>(null)

  useEffect(() => {
    fetchFollowUpReports()
  }, [user])

  const fetchFollowUpReports = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://attendancesystem-2gjw.onrender.com/api/FollowupReport', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch follow-up reports')
      }
      const data = await response.json()
      if (data.success) {
        setFollowUpReports(data.result.items)
      } else {
        throw new Error(data.message || 'Failed to fetch follow-up reports')
      }
    } catch (error) {
      setError('Error fetching follow-up reports: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowUpReportById = async (id: string) => {
    try {
      const response = await fetch(`https://attendancesystem-2gjw.onrender.com/api/FollowupReport/${id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
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
      setError('Error fetching follow-up report: ' + error.message)
    }
  }

  const createFollowUpReport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('https://attendancesystem-2gjw.onrender.com/api/FollowupReport', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReport),
      })
      if (!response.ok) {
        throw new Error('Failed to create follow-up report')
      }
      await fetchFollowUpReports()
      setNewReport({ followUpDetails: [] })
    } catch (error) {
      setError('Error creating follow-up report: ' + error.message)
    }
  }

  const updateFollowUpReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReport) return
    try {
      const response = await fetch(`https://attendancesystem-2gjw.onrender.com/api/FollowupReport/${editingReport.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingReport),
      })
      if (!response.ok) {
        throw new Error('Failed to update follow-up report')
      }
      await fetchFollowUpReports()
      setEditingReport(null)
    } catch (error) {
      setError('Error updating follow-up report: ' + error.message)
    }
  }

  const deleteFollowUpReport = async (id: string) => {
    try {
      const response = await fetch(`https://attendancesystem-2gjw.onrender.com/api/FollowupReport/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete follow-up report')
      }
      await fetchFollowUpReports()
    } catch (error) {
      setError('Error deleting follow-up report: ' + error.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Follow-up Reports</h2>
      
      {/* Create new follow-up report form */}
      <form onSubmit={createFollowUpReport} className="space-y-4">
        <input
          type="text"
          placeholder="Member Full Name"
          value={newReport.memberFullName || ''}
          onChange={(e) => setNewReport({...newReport, memberFullName: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Activity Name"
          value={newReport.activityName || ''}
          onChange={(e) => setNewReport({...newReport, activityName: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Follow-up Type"
          value={newReport.followUpType || ''}
          onChange={(e) => setNewReport({...newReport, followUpType: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Total Follow-ups"
          value={newReport.totalFollowUps || ''}
          onChange={(e) => setNewReport({...newReport, totalFollowUps: parseInt(e.target.value)})}
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Notes"
          value={newReport.notes || ''}
          onChange={(e) => setNewReport({...newReport, notes: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          value={newReport.date || ''}
          onChange={(e) => setNewReport({...newReport, date: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Add Follow-up Report</button>
      </form>

      {/* List of follow-up reports */}
      <div className="space-y-4">
        {followUpReports.map((report) => (
          <div key={report.id} className="p-4 border rounded">
            {editingReport && editingReport.id === report.id ? (
              <form onSubmit={updateFollowUpReport} className="space-y-2">
                <input
                  type="text"
                  value={editingReport.memberFullName}
                  onChange={(e) => setEditingReport({...editingReport, memberFullName: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editingReport.activityName}
                  onChange={(e) => setEditingReport({...editingReport, activityName: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editingReport.followUpType}
                  onChange={(e) => setEditingReport({...editingReport, followUpType: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  value={editingReport.totalFollowUps}
                  onChange={(e) => setEditingReport({...editingReport, totalFollowUps: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded"
                />
                <textarea
                  value={editingReport.notes}
                  onChange={(e) => setEditingReport({...editingReport, notes: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="date"
                  value={editingReport.date}
                  onChange={(e) => setEditingReport({...editingReport, date: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">Save</button>
                <button onClick={() => setEditingReport(null)} className="px-4 py-2 bg-gray-500 text-white rounded ml-2">Cancel</button>
              </form>
            ) : (
              <>
                <h3 className="font-bold">{report.memberFullName}</h3>
                <p>Activity: {report.activityName}</p>
                <p>Follow-up Type: {report.followUpType}</p>
                <p>Total Follow-ups: {report.totalFollowUps}</p>
                <p>Date: {new Date(report.date).toLocaleDateString()}</p>
                <p>Notes: {report.notes}</p>
                <button onClick={() => setEditingReport(report)} className="px-4 py-2 bg-yellow-500 text-white rounded mt-2">Edit</button>
                <button onClick={() => deleteFollowUpReport(report.id)} className="px-4 py-2 bg-red-500 text-white rounded mt-2 ml-2">Delete</button>
                <button onClick={() => fetchFollowUpReportById(report.id)} className="px-4 py-2 bg-blue-500 text-white rounded mt-2 ml-2">View Details</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Selected follow-up report details */}
      {selectedReport && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="text-xl font-bold mb-2">Selected Follow-up Report Details</h3>
          <p><strong>Member:</strong> {selectedReport.memberFullName}</p>
          <p><strong>Activity:</strong> {selectedReport.activityName}</p>
          <p><strong>Follow-up Type:</strong> {selectedReport.followUpType}</p>
          <p><strong>Total Follow-ups:</strong> {selectedReport.totalFollowUps}</p>
          <p><strong>Date:</strong> {new Date(selectedReport.date).toLocaleDateString()}</p>
          <p><strong>Notes:</strong> {selectedReport.notes}</p>
          <h4 className="font-bold mt-2">Follow-up Details:</h4>
          <ul className="list-disc pl-5">
            {selectedReport.followUpDetails.map((detail, index) => (
              <li key={index}>
                <strong>{detail.fullName}:</strong> {detail.notes}
              </li>
            ))}
          </ul>
          <button onClick={() => setSelectedReport(null)} className="px-4 py-2 bg-gray-500 text-white rounded mt-2">Close</button>
        </div>
      )}
    </div>
  )
}

