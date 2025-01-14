'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { API_BASE_URL } from '../../config'

interface Fellowship {
  id: string
  name: string
  pastorFullName: string
  location: string
  meetingTime: string
}

export function ManageFellowships() {
  const { user } = useAuth()
  const [fellowships, setFellowships] = useState<Fellowship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingFellowship, setEditingFellowship] = useState<Fellowship | null>(null)
  const [newFellowship, setNewFellowship] = useState<Partial<Fellowship>>({})
  const [selectedFellowship, setSelectedFellowship] = useState<Fellowship | null>(null)

  useEffect(() => {
    fetchFellowships()
  }, [user])

  const fetchFellowships = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Fellowship`, {
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
      } else {
        throw new Error(data.message || 'Failed to fetch fellowships')
      }
    } catch (error) {
      setError('Error fetching fellowships: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFellowshipById = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Fellowship/${id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch fellowship')
      }
      const data = await response.json()
      if (data.success) {
        setSelectedFellowship(data.result)
      } else {
        throw new Error(data.message || 'Failed to fetch fellowship')
      }
    } catch (error) {
      setError('Error fetching fellowship: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const createFellowship = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Fellowship`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFellowship),
      })
      if (!response.ok) {
        throw new Error('Failed to create fellowship')
      }
      await fetchFellowships()
      setNewFellowship({})
    } catch (error) {
      setError('Error creating fellowship: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateFellowship = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFellowship) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Fellowship/${editingFellowship.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingFellowship),
      })
      if (!response.ok) {
        throw new Error('Failed to update fellowship')
      }
      await fetchFellowships()
      setEditingFellowship(null)
    } catch (error) {
      setError('Error updating fellowship: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteFellowship = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Fellowship/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete fellowship')
      }
      await fetchFellowships()
    } catch (error) {
      setError('Error deleting fellowship: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Fellowships</h2>
      
      {/* Create new fellowship form */}
      <form onSubmit={createFellowship} className="space-y-4">
        <input
          type="text"
          placeholder="Fellowship Name"
          value={newFellowship.name || ''}
          onChange={(e) => setNewFellowship({...newFellowship, name: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Pastor Full Name"
          value={newFellowship.pastorFullName || ''}
          onChange={(e) => setNewFellowship({...newFellowship, pastorFullName: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Location"
          value={newFellowship.location || ''}
          onChange={(e) => setNewFellowship({...newFellowship, location: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Meeting Time"
          value={newFellowship.meetingTime || ''}
          onChange={(e) => setNewFellowship({...newFellowship, meetingTime: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Add Fellowship</button>
      </form>

      {/* List of fellowships */}
      <div className="space-y-4">
        {fellowships.map((fellowship) => (
          <div key={fellowship.id} className="p-4 border rounded">
            {editingFellowship && editingFellowship.id === fellowship.id ? (
              <form onSubmit={updateFellowship} className="space-y-2">
                <input
                  type="text"
                  value={editingFellowship.name}
                  onChange={(e) => setEditingFellowship({...editingFellowship, name: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editingFellowship.pastorFullName}
                  onChange={(e) => setEditingFellowship({...editingFellowship, pastorFullName: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editingFellowship.location}
                  onChange={(e) => setEditingFellowship({...editingFellowship, location: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editingFellowship.meetingTime}
                  onChange={(e) => setEditingFellowship({...editingFellowship, meetingTime: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">Save</button>
                <button onClick={() => setEditingFellowship(null)} className="px-4 py-2 bg-gray-500 text-white rounded ml-2">Cancel</button>
              </form>
            ) : (
              <>
                <h3 className="font-bold">{fellowship.name}</h3>
                <p>Pastor: {fellowship.pastorFullName}</p>
                <p>Location: {fellowship.location}</p>
                <p>Meeting Time: {fellowship.meetingTime}</p>
                <button onClick={() => setEditingFellowship(fellowship)} className="px-4 py-2 bg-yellow-500 text-white rounded mt-2">Edit</button>
                <button onClick={() => deleteFellowship(fellowship.id)} className="px-4 py-2 bg-red-500 text-white rounded mt-2 ml-2">Delete</button>
                <button onClick={() => fetchFellowshipById(fellowship.id)} className="px-4 py-2 bg-blue-500 text-white rounded mt-2 ml-2">View Details</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Selected fellowship details */}
      {selectedFellowship && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="text-xl font-bold mb-2">Selected Fellowship Details</h3>
          <p><strong>Name:</strong> {selectedFellowship.name}</p>
          <p><strong>Pastor:</strong> {selectedFellowship.pastorFullName}</p>
          <p><strong>Location:</strong> {selectedFellowship.location}</p>
          <p><strong>Meeting Time:</strong> {selectedFellowship.meetingTime}</p>
          <button onClick={() => setSelectedFellowship(null)} className="px-4 py-2 bg-gray-500 text-white rounded mt-2">Close</button>
        </div>
      )}
    </div>
  )
}
