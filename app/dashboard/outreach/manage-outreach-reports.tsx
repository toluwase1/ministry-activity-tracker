'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { API_BASE_URL } from '../../config'

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
  const { user } = useAuth()
  const [reports, setReports] = useState<OutreachReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingReport, setEditingReport] = useState<OutreachReport | null>(null)
  const [newReport, setNewReport] = useState<Partial<OutreachReport>>({})
  const [selectedReport, setSelectedReport] = useState<OutreachReport | null>(null)

  useEffect(() => {
    fetchReports()
  }, [user])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/OutreachReport`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch outreach reports')
      }
      const data = await response.json()
      if (data.success) {
        setReports(data.result.items)
      } else {
        throw new Error(data.message || 'Failed to fetch outreach reports')
      }
    } catch (error) {
      setError('Error fetching outreach reports: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchReportById = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/OutreachReport/${id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch outreach report')
      }
      const data = await response.json()
      if (data.success) {
        setSelectedReport(data.result)
      } else {
        throw new Error(data.message || 'Failed to fetch outreach report')
      }
    } catch (error) {
      setError('Error fetching outreach report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/OutreachReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReport),
      })
      if (!response.ok) {
        throw new Error('Failed to create outreach report')
      }
      await fetchReports()
      setNewReport({})
    } catch (error) {
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
      const response = await fetch(`${API_BASE_URL}/OutreachReport/${editingReport.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingReport),
      })
      if (!response.ok) {
        throw new Error('Failed to update outreach report')
      }
      await fetchReports()
      setEditingReport(null)
    } catch (error) {
      setError('Error updating outreach report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteReport = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/OutreachReport/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete outreach report')
      }
      await fetchReports()
    } catch (error) {
      setError('Error deleting outreach report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error:
