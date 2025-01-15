'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getApiUrl } from '../../utils/api-url'
import { handleApiResponse, type ApiResponse } from '../../utils/api-response'
import { toast } from 'sonner'
import LoadingSpinner from '../../components/LoadingSpinner'

interface OutreachReport {
  id: string
  memberId: string
  memberFullName: string
  activityId: string
  activityName: string
  totalPeopleReached: number
  notes: string
  date: string
}

export function ManageOutreachReports() {
  const { token } = useAuth()
  const [reports, setReports] = useState<OutreachReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingReport, setEditingReport] = useState<OutreachReport | null>(null)
  const [newReport, setNewReport] = useState<Partial<OutreachReport>>({})
  const [selectedReport, setSelectedReport] = useState<OutreachReport | null>(null)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl('OutreachReport'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setReports(data.result.items)
      }
    } catch (error) {
      console.error('Error fetching outreach reports:', error)
      toast.error('Failed to load outreach reports')
      setError('Error fetching outreach reports: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchReportById = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(getApiUrl(`OutreachReport/${id}`), {
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
      console.error('Error fetching outreach report:', error)
      toast.error('Failed to load outreach report')
      setError('Error fetching outreach report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(getApiUrl('OutreachReport'), {
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
        await fetchReports()
        setNewReport({})
      }
    } catch (error) {
      console.error('Error creating outreach report:', error)
      toast.error('Failed to create outreach report')
      setError('Error creating outreach report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReport) return
    setLoading(true)
    try {
      const response = await fetch(getApiUrl(`OutreachReport/${editingReport.id}`), {
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
        await fetchReports()
        setEditingReport(null)
      }
    } catch (error) {
      console.error('Error updating outreach report:', error)
      toast.error('Failed to update outreach report')
      setError('Error updating outreach report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteReport = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(getApiUrl(`OutreachReport/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        await fetchReports()
      }
    } catch (error) {
      console.error('Error deleting outreach report:', error)
      toast.error('Failed to delete outreach report')
      setError('Error deleting outreach report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchReports()
    }
  }, [token])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>
}
