'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getApiUrl } from '../../utils/api-url'
import { handleApiResponse, type ApiResponse } from '../../utils/api-response'
import { toast } from 'sonner'
import LoadingSpinner from '../../components/LoadingSpinner'

interface AttendanceReport {
  id: string
  memberId: string
  memberFullName: string
  activityId: string
  activityName: string
  isPresent: boolean
  date: string
}

export function ManageAttendance() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [attendanceReports, setAttendanceReports] = useState<AttendanceReport[]>([])
  const [error, setError] = useState('')
  const [editingReport, setEditingReport] = useState<AttendanceReport | null>(null)
  const [newReport, setNewReport] = useState<Partial<AttendanceReport>>({})
  const [selectedReport, setSelectedReport] = useState<AttendanceReport | null>(null)

  useEffect(() => {
    if (token) {
      fetchAttendanceReports()
    }
  }, [token])

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
      setError('Error fetching attendance reports: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceReportById = async (id: string) => {
    try {
      const response = await fetch(getApiUrl(`AttendanceReport/${id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setSelectedReport(data.result)
      }
    } catch (error) {
      console.error('Error fetching attendance report:', error)
      setError('Error fetching attendance report: ' + error.message)
    }
  }

  const createAttendanceReport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(getApiUrl('AttendanceReport'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newReport),
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        await fetchAttendanceReports()
        setNewReport({})
      }
    } catch (error) {
      console.error('Error creating attendance report:', error)
      setError('Error creating attendance report: ' + error.message)
    }
  }

  const updateAttendanceReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReport) return
    try {
      const response = await fetch(getApiUrl(`AttendanceReport/${editingReport.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(editingReport),
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        await fetchAttendanceReports()
        setEditingReport(null)
      }
    } catch (error) {
      console.error('Error updating attendance report:', error)
      setError('Error updating attendance report: ' + error.message)
    }
  }

  const deleteAttendanceReport = async (id: string) => {
    try {
      const response = await fetch(getApiUrl(`AttendanceReport/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        await fetchAttendanceReports()
      }
    } catch (error) {
      console.error('Error deleting attendance report:', error)
      setError('Error deleting attendance report: ' + error.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Attendance</h2>
      
      {/* Create new attendance report form */}
      <form onSubmit={createAttendanceReport} className="space-y-4">
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
        <select
          value={newReport.isPresent ? 'true' : 'false'}
          onChange={(e) => setNewReport({...newReport, isPresent: e.target.value === 'true'})}
          className="w-full p-2 border rounded"
        >
          <option value="true">Present</option>
          <option value="false">Absent</option>
        </select>
        <input
          type="date"
          value={newReport.date || ''}
          onChange={(e) => setNewReport({...newReport, date: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Add Attendance Report</button>
      </form>

      {/* List of attendance reports */}
      <div className="space-y-4">
        {attendanceReports.map((report) => (
          <div key={report.id} className="p-4 border rounded">
            {editingReport && editingReport.id === report.id ? (
              <form onSubmit={updateAttendanceReport} className="space-y-2">
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
                <select
                  value={editingReport.isPresent ? 'true' : 'false'}
                  onChange={(e) => setEditingReport({...editingReport, isPresent: e.target.value === 'true'})}
                  className="w-full p-2 border rounded"
                >
                  <option value="true">Present</option>
                  <option value="false">Absent</option>
                </select>
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
                <p>Present: {report.isPresent ? 'Yes' : 'No'}</p>
                <p>Date: {new Date(report.date).toLocaleDateString()}</p>
                <button onClick={() => setEditingReport(report)} className="px-4 py-2 bg-yellow-500 text-white rounded mt-2">Edit</button>
                <button onClick={() => deleteAttendanceReport(report.id)} className="px-4 py-2 bg-red-500 text-white rounded mt-2 ml-2">Delete</button>
                <button onClick={() => fetchAttendanceReportById(report.id)} className="px-4 py-2 bg-blue-500 text-white rounded mt-2 ml-2">View Details</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Selected attendance report details */}
      {selectedReport && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="text-xl font-bold mb-2">Selected Attendance Report Details</h3>
          <p><strong>Member:</strong> {selectedReport.memberFullName}</p>
          <p><strong>Activity:</strong> {selectedReport.activityName}</p>
          <p><strong>Present:</strong> {selectedReport.isPresent ? 'Yes' : 'No'}</p>
          <p><strong>Date:</strong> {new Date(selectedReport.date).toLocaleDateString()}</p>
          <button onClick={() => setSelectedReport(null)} className="px-4 py-2 bg-gray-500 text-white rounded mt-2">Close</button>
        </div>
      )}
    </div>
  )
}
