'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getApiUrl } from '../utils/api-url'
import { handleApiResponse, type ApiResponse } from '../utils/api-response'
import { toast } from 'sonner'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fellowships, setFellowships] = useState([])

  const fetchFellowships = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl('Fellowship'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        setFellowships(data.result.items)
      }
    } catch (error) {
      console.error('Error fetching fellowships:', error)
      toast.error('Failed to load fellowships')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchFellowships()
    }
  }, [token])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Fellowships</h2>
        {fellowships.length > 0 ? (
          <ul>
            {fellowships.map((fellowship: any) => (
              <li key={fellowship.id} className="mb-2">
                {fellowship.name} - Pastor: {fellowship.pastorFullName || 'Not assigned'}
              </li>
            ))}
          </ul>
        ) : (
          <p>No fellowships found.</p>
        )}
      </div>
    </div>
  )
}
