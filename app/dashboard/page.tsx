'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [fellowships, setFellowships] = useState([])

  useEffect(() => {
    const fetchFellowships = async () => {
      try {
        const response = await fetch('https://attendancesystem-2gjw.onrender.com/api/Fellowship', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        })
        if (!response.ok) {
          throw new Error('Failed to fetch fellowships')
        }
        const data = await response.json()
        if (data.success) {
          setFellowships(data.result.items)
        }
      } catch (error) {
        console.error('Error fetching fellowships:', error)
      }
    }

    if (user) {
      fetchFellowships()
    }
  }, [user])

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

