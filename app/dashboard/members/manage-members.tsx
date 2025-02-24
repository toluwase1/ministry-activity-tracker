'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getApiUrl } from '../../utils/api-url'
import { handleApiResponse } from '../../utils/api-response'
import { toast } from 'sonner'
import LoadingSpinner from '../../components/LoadingSpinner'

enum MemberTypeEnum {
  Pastor = 'Pastor',
  WorkersInTraining = 'WorkersInTraining',
  Disciple = 'Disciple'
}

enum MemberType {
  Pastor = 'Pastor',
  WorkersInTraining = 'WorkersInTraining',
  Disciple = 'Disciple'
}

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  gender: string
  memberType: MemberType
  disciplerId?: string
  disciplerFullName?: string
  fellowshipId: string
  fellowshipName?: string
  isActive: boolean
  status: string
}

interface Fellowship {
  id: string
  name: string
  description?: string
  status: string
}

interface MemberFilters {
  search?: string
  page: number
  pageSize: number
  sortColumn?: string
  sortOrder?: 'asc' | 'desc'
}

export function ManageMembers() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [fellowships, setFellowships] = useState<Fellowship[]>([])
  const [potentialDisciplers, setPotentialDisciplers] = useState<Member[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<MemberFilters>({
    page: 1,
    pageSize: 10,
    sortColumn: 'firstName',
    sortOrder: 'asc'
  })
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    memberType: MemberType.Pastor,
    disciplerId: '',
    fellowshipId: ''
  })
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [approvalData, setApprovalData] = useState({
    memberType: MemberTypeEnum.Disciple as string,
    userId: '',
    status: 'Approved'
  })

  const fetchMembers = async () => {
    if (!token) return

    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        pageSize: filters.pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.sortColumn && { sortColumn: filters.sortColumn }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder })
      })

      const response = await fetch(getApiUrl(`Member?${queryParams}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }

      const data = await response.json()
      if (handleApiResponse(data)) {
        setMembers(data.result.items)
        setTotalCount(data.result.totalCount)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const fetchFellowships = async () => {
    if (!token) return

    try {
      const response = await fetch(getApiUrl('Fellowship'), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch fellowships')
      }

      const data = await response.json()
      if (handleApiResponse(data)) {
        setFellowships(data.result.items)
      }
    } catch (error) {
      console.error('Error fetching fellowships:', error)
      toast.error('Failed to load fellowships')
    }
  }

  const fetchPotentialDisciplers = async () => {
    if (!token) return

    try {
      const response = await fetch(getApiUrl('Member'), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch potential disciplers')
      }

      const data = await response.json()
      if (handleApiResponse(data)) {
        setPotentialDisciplers(data.result.items)
      }
    } catch (error) {
      console.error('Error fetching potential disciplers:', error)
      toast.error('Failed to load potential disciplers')
    }
  }

  useEffect(() => {
    if (token) {
      fetchMembers()
      fetchFellowships()
      fetchPotentialDisciplers()
    }
  }, [token, filters])

  const fetchMemberForView = async (id: string) => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`Member/${id}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch member details')
      }

      const data = await response.json()
      if (handleApiResponse(data)) {
        setSelectedMember(data.result)
      }
    } catch (error) {
      console.error('Error fetching member:', error)
      toast.error('Failed to load member details')
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberForEdit = async (id: string) => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`Member/${id}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch member details')
      }

      const data = await response.json()
      if (handleApiResponse(data)) {
        setEditingMember(data.result)
      }
    } catch (error) {
      console.error('Error fetching member:', error)
      toast.error('Failed to load member details')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      console.log('Creating member with data:', newMember)
      
      const memberData = {
        ...newMember,
        disciplerId: newMember.disciplerId || null
      }
      
      const response = await fetch(getApiUrl('Member'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(memberData)
      })

      const data = await response.json()
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        data
      })
      
      if (handleApiResponse(data) && response.ok) {
        toast.success('Member created successfully')
        setNewMember({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          gender: '',
          memberType: MemberType.Pastor,
          disciplerId: '',
          fellowshipId: ''
        })
        await fetchMembers()
      } else {
        console.error('API Error Response:', data)
        toast.error(data.message || 'Failed to create member')
      }
    } catch (error) {
      console.error('Error creating member:', error)
      toast.error('Failed to create member')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl('Member/edit'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(editingMember)
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        toast.success('Member updated successfully')
        setEditingMember(null)
        setSelectedMember(null)
        await fetchMembers()
      }
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl('Member/delete'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ memberId: id })
      })

      const data = await response.json()
      if (handleApiResponse(data) && response.ok) {
        toast.success('Member deleted successfully')
        await fetchMembers()
      }
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error('Failed to delete member')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (memberId: string) => {
    try {
      setLoading(true)
      console.log('Approving member:', memberId)
      
      const response = await fetch(getApiUrl('Auth/approval'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          memberType: approvalData.memberType,
          userId: memberId,
          status: "Approved"
        })
      })

      const data = await response.json()
      console.log('Approval response:', data)

      if (response.ok && data.success) {
        toast.success('Member approved successfully')
        fetchMembers()
      } else {
        toast.error(data.message || 'Failed to approve member')
      }
    } catch (error) {
      console.error('Error approving member:', error)
      toast.error('Failed to approve member')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: keyof MemberFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Create New Member</h2>
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newMember.firstName}
                onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newMember.lastName}
                onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newMember.phoneNumber}
                onChange={(e) => setNewMember({ ...newMember, phoneNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newMember.gender}
                onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Member Type</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newMember.memberType}
                onChange={(e) => setNewMember({ ...newMember, memberType: e.target.value as MemberType })}
                required
              >
                <option value="">Select Member Type</option>
                {Object.values(MemberType).map((type) => (
                  <option key={type} value={type}>
                    {type === MemberType.WorkersInTraining ? 'Workers In Training' : type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fellowship</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newMember.fellowshipId}
                onChange={(e) => setNewMember({ ...newMember, fellowshipId: e.target.value })}
                required
              >
                <option value="">Select Fellowship</option>
                {fellowships.map((fellowship) => (
                  <option key={fellowship.id} value={fellowship.id}>
                    {fellowship.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Worker-In-Charge-Of</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newMember.disciplerId}
                onChange={(e) => setNewMember({ ...newMember, disciplerId: e.target.value })}
              >
                <option value="">Select Worker-In-Charge-Of (Optional)</option>
                {potentialDisciplers.map((discipler) => (
                  <option key={discipler.id} value={discipler.id}>
                    {discipler.firstName} {discipler.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search members..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium">Members</h2>
          <div className="flex items-center space-x-4">
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.sortColumn}
              onChange={(e) => handleFilterChange('sortColumn', e.target.value)}
            >
              <option value="firstName">First Name</option>
              <option value="lastName">Last Name</option>
              <option value="email">Email</option>
            </select>
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {members.map((member) => (
              <li key={member.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <p className="text-sm text-gray-500">{member.phoneNumber}</p>
                    <p className="text-sm text-gray-500">{member.memberType}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => fetchMemberForView(member.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => fetchMemberForEdit(member.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                    {member.status === 'Pending' && (
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handleFilterChange('page', (filters.page - 1).toString())}
              disabled={filters.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => handleFilterChange('page', (filters.page + 1).toString())}
              disabled={filters.page * filters.pageSize >= totalCount}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {Math.min((filters.page - 1) * filters.pageSize + 1, totalCount)}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(filters.page * filters.pageSize, totalCount)}
                </span>{' '}
                of <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handleFilterChange('page', (filters.page - 1).toString())}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleFilterChange('page', (filters.page + 1).toString())}
                  disabled={filters.page * filters.pageSize >= totalCount}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Edit Member</h3>
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingMember.firstName}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingMember.lastName}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, lastName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingMember.email}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingMember.phoneNumber}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, phoneNumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingMember.gender}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, gender: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Type</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingMember.memberType}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, memberType: e.target.value as MemberType })
                    }
                    required
                  >
                    <option value="">Select Member Type</option>
                    {Object.values(MemberType).map((type) => (
                      <option key={type} value={type}>
                        {type === MemberType.WorkersInTraining ? 'Workers In Training' : type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fellowship</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingMember.fellowshipId}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, fellowshipId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Fellowship</option>
                    {fellowships.map((fellowship) => (
                      <option key={fellowship.id} value={fellowship.id}>
                        {fellowship.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Worker-In-Charge-Of</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={editingMember.disciplerId}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, disciplerId: e.target.value })
                    }
                  >
                    <option value="">Select Worker-In-Charge-Of (Optional)</option>
                    {potentialDisciplers.map((discipler) => (
                      <option key={discipler.id} value={discipler.id}>
                        {discipler.firstName} {discipler.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSelectedMember(null);
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Member Details</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">First Name</p>
                <p className="text-sm text-gray-900">{selectedMember.firstName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Last Name</p>
                <p className="text-sm text-gray-900">{selectedMember.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-900">{selectedMember.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Phone Number</p>
                <p className="text-sm text-gray-900">{selectedMember.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Gender</p>
                <p className="text-sm text-gray-900">{selectedMember.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Member Type</p>
                <p className="text-sm text-gray-900">{selectedMember.memberType}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700">Fellowship Name</p>
                <p className="text-sm text-gray-900">{selectedMember.fellowshipName}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700">Status</p>
                <p className="text-sm text-gray-900">{selectedMember.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Approval Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Approve Member</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Member Type
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={approvalData.memberType}
                onChange={(e) => setApprovalData({ ...approvalData, memberType: e.target.value })}
              >
                {Object.values(MemberTypeEnum).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={() => setSelectedMember(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={() => {
                  handleApprove(selectedMember.id)
                  setSelectedMember(null)
                }}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
