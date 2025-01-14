'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ManageMembers } from './manage-members'

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

export default function MembersPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('https://attendancesystem-2gjw.onrender.com/api/Member', {
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

    if (user) {
      fetchMembers()
    }
  }, [user])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Members</h1>
      <ManageMembers />
    </div>
  )
}

