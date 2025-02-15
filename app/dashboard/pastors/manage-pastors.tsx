'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Pastor {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  fellowshipName: string
}

interface PendingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function ManagePastors() {
  const { token } = useAuth()
  const [pastors, setPastors] = useState<Pastor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingPastor, setEditingPastor] = useState<Pastor | null>(null)
  const [newPastor, setNewPastor] = useState<Partial<Pastor>>({})
  const [selectedPastor, setSelectedPastor] = useState<Pastor | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<PendingUser[]>([]);

  useEffect(() => {
    fetchPastors()
    fetchPendingApprovals();
  }, [token])

  const fetchPastors = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Pastor`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch pastors')
      }
      const data = await response.json()
      if (data.success) {
        setPastors(data.result.items)
      } else {
        throw new Error(data.message || 'Failed to fetch pastors')
      }
    } catch (error) {
      setError('Error fetching pastors: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingApprovals = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pending approvals');
      }
      const data = await response.json();
      if (data.success) {
        setPendingApprovals(data.result.items)
      } else {
        throw new Error(data.message || 'Failed to fetch pending approvals');
      }
    } catch (error) {
      setError('Error fetching pending approvals: ' + error);
    } finally {
      setLoading(false)
    }
  };

  const fetchPastorById = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Pastor/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch pastor')
      }
      const data = await response.json()
      if (data.success) {
        setSelectedPastor(data.result.result)
      } else {
        throw new Error(data.message || 'Failed to fetch pastor')
      }
    } catch (error) {
      setError('Error fetching pastor: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const createPastor = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Pastor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPastor),
      })
      if (!response.ok) {
        throw new Error('Failed to create pastor')
      }
      await fetchPastors()
      setNewPastor({})
    } catch (error) {
      setError('Error creating pastor: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const updatePastor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPastor) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Pastor/${editingPastor.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPastor),
      })
      if (!response.ok) {
        throw new Error('Failed to update pastor')
      }
      await fetchPastors()
      setEditingPastor(null)
    } catch (error) {
      setError('Error updating pastor: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const deletePastor = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Pastor/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete pastor')
      }
      await fetchPastors()
    } catch (error) {
      setError('Error deleting pastor: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const approveUser = async (userId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/approve/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to approve user')
      }
      await fetchPendingApprovals();
    } catch (error) {
      setError('Error approving user: ' + error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Pastors</h2>

      {/* Create new pastor form */}
      <form onSubmit={createPastor} className="space-y-4">
        <input
          type="text"
          placeholder="First Name"
          value={newPastor.firstName || ''}
          onChange={(e) => setNewPastor({...newPastor, firstName: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={newPastor.lastName || ''}
          onChange={(e) => setNewPastor({...newPastor, lastName: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={newPastor.email || ''}
          onChange={(e) => setNewPastor({...newPastor, email: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={newPastor.phoneNumber || ''}
          onChange={(e) => setNewPastor({...newPastor, phoneNumber: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Fellowship Name"
          value={newPastor.fellowshipName || ''}
          onChange={(e) => setNewPastor({...newPastor, fellowshipName: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Add Pastor</button>
      </form>

      {/* List of pastors */}
      <div className="space-y-4">
        {pastors.map((pastor) => (
          <div key={pastor.id} className="p-4 border rounded">
            {editingPastor && editingPastor.id === pastor.id ? (
              <form onSubmit={updatePastor} className="space-y-2">
                <input
                  type="text"
                  value={editingPastor.firstName}
                  onChange={(e) => setEditingPastor({...editingPastor, firstName: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editingPastor.lastName}
                  onChange={(e) => setEditingPastor({...editingPastor, lastName: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="email"
                  value={editingPastor.email}
                  onChange={(e) => setEditingPastor({...editingPastor, email: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="tel"
                  value={editingPastor.phoneNumber}
                  onChange={(e) => setEditingPastor({...editingPastor, phoneNumber: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editingPastor.fellowshipName}
                  onChange={(e) => setEditingPastor({...editingPastor, fellowshipName: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">Save</button>
                <button onClick={() => setEditingPastor(null)} className="px-4 py-2 bg-gray-500 text-white rounded ml-2">Cancel</button>
              </form>
            ) : (
              <>
                <h3 className="font-bold">{pastor.firstName} {pastor.lastName}</h3>
                <p>Email: {pastor.email}</p>
                <p>Phone: {pastor.phoneNumber}</p>
                <p>Fellowship: {pastor.fellowshipName}</p>
                <button onClick={() => setEditingPastor(pastor)} className="px-4 py-2 bg-yellow-500 text-white rounded mt-2">Edit</button>
                <button onClick={() => deletePastor(pastor.id)} className="px-4 py-2 bg-red-500 text-white rounded mt-2 ml-2">Delete</button>
                <button onClick={() => fetchPastorById(pastor.id)} className="px-4 py-2 bg-blue-500 text-white rounded mt-2 ml-2">View Details</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Pending Approvals</h3>
        <div className="space-y-4">
          {pendingApprovals.map((pendingUser) => (
            <div key={pendingUser.id} className="p-4 border rounded">
              <p><strong>Name:</strong> {pendingUser.firstName} {pendingUser.lastName}</p>
              <p><strong>Email:</strong> {pendingUser.email}</p>
              <button 
                onClick={() => approveUser(pendingUser.id)} 
                className="px-4 py-2 bg-green-500 text-white rounded mt-2"
              >
                Approve
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected pastor details */}
      {selectedPastor && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="text-xl font-bold mb-2">Selected Pastor Details</h3>
          <p><strong>Name:</strong> {selectedPastor.firstName} {selectedPastor.lastName}</p>
          <p><strong>Email:</strong> {selectedPastor.email}</p>
          <p><strong>Phone:</strong> {selectedPastor.phoneNumber}</p>
          <p><strong>Fellowship:</strong> {selectedPastor.fellowshipName}</p>
          <button onClick={() => setSelectedPastor(null)} className="px-4 py-2 bg-gray-500 text-white rounded mt-2">Close</button>
        </div>
      )}
    </div>
  )
}
