'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  gender: string
  fellowshipName: string
  status: string
}

export function ManageMembers() {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [newMember, setNewMember] = useState<Partial<Member>>({})
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [user])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Member`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
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
      setError('Error fetching members: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberById = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Member/${id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch member')
      }
      const data = await response.json()
      if (data.success) {
        setSelectedMember(data.result)
      } else {
        throw new Error(data.message || 'Failed to fetch member')
      }
    } catch (error) {
      setError('Error fetching member: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Member`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMember),
      })
      if (!response.ok) {
        throw new Error('Failed to create member')
      }
      await fetchMembers()
      setNewMember({})
    } catch (error) {
      setError('Error creating member: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Member/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingMember),
      })
      if (!response.ok) {
        throw new Error('Failed to update member')
      }
      await fetchMembers()
      setEditingMember(null)
    } catch (error) {
      setError('Error updating member: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteMember = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Member/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete member')
      }
      await fetchMembers()
    } catch (error) {
      setError('Error deleting member: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Members</h2>
      
      {/* Create new member form */}
      <form onSubmit={createMember} className="space-y-4">
        <input
          type="text"
          placeholder="First Name"
          value={newMember.firstName || ''}
          onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={newMember.lastName || ''}
          onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={newMember.email || ''}
          onChange={(e) => setNewMember({...newMember, email: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Add Member</button>
      </form>

      {/* List of members */}
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="p-4 border rounded">
            {editingMember && editingMember.id === member.id ? (
              <form onSubmit={updateMember} className="space-y-2">
                <input
                  type="text"
                  value={editingMember.firstName}
                  onChange={(e) => setEditingMember({...editingMember, firstName: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editingMember.lastName}
                  onChange={(e) => setEditingMember({...editingMember, lastName: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="email"
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({...editingMember, email: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">Save</button>
                <button onClick={() => setEditingMember(null)} className="px-4 py-2 bg-gray-500 text-white rounded ml-2">Cancel</button>
              </form>
            ) : (
              <>
                <h3 className="font-bold">{member.firstName} {member.lastName}</h3>
                <p>{member.email}</p>
                <button onClick={() => setEditingMember(member)} className="px-4 py-2 bg-yellow-500 text-white rounded mt-2">Edit</button>
                <button onClick={() => deleteMember(member.id)} className="px-4 py-2 bg-red-500 text-white rounded mt-2 ml-2">Delete</button>
                <button onClick={() => fetchMemberById(member.id)} className="px-4 py-2 bg-blue-500 text-white rounded mt-2 ml-2">View Details</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Selected member details */}
      {selectedMember && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="text-xl font-bold mb-2">Selected Member Details</h3>
          <p><strong>Name:</strong> {selectedMember.firstName} {selectedMember.lastName}</p>
          <p><strong>Email:</strong> {selectedMember.email}</p>
          <p><strong>Phone:</strong> {selectedMember.phoneNumber}</p>
          <p><strong>Gender:</strong> {selectedMember.gender}</p>
          <p><strong>Fellowship:</strong> {selectedMember.fellowshipName}</p>
          <p><strong>Status:</strong> {selectedMember.status}</p>
          <button onClick={() => setSelectedMember(null)} className="px-4 py-2 bg-gray-500 text-white rounded mt-2">Close</button>
        </div>
      )}
    </div>
  )
}

