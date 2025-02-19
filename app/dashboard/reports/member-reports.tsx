'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getApiUrl } from '../../utils/api-url'
import { handleApiResponse } from '../../utils/api-response'
import { toast } from 'sonner'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import LoadingSpinner from '../../components/LoadingSpinner'

interface AttendanceRecord {
  weekStart: string;
  weekEnd: string;
  activityName: string;
  attendance: number;
  memberId: string;
}

interface AttendanceReport {
  [memberName: string]: AttendanceRecord[];
}

interface Activity {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
}

interface ReportResponse {
  success: boolean;
  result: Record<string, AttendanceRecord[]>;
  message?: string;
}

interface ProcessedReport {
  memberName: string;
  records: AttendanceRecord[];
}

export function MemberReports() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    return lastWeek
  })
  const [endDate, setEndDate] = useState<Date | null>(() => new Date)
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [memberId, setMemberId] = useState<string>('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [reportData, setReportData] = useState<AttendanceReport | null>(null)
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set())

  // Add toggle function for expanding/collapsing member sections
  const toggleMember = (memberName: string) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(memberName)) {
        newSet.delete(memberName)
      } else {
        newSet.add(memberName)
      }
      return newSet
    })
  }

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([fetchActivities(), fetchMembers()])
    }
    initializeData()
  }, [])
  useEffect(() => {
    if (activities.length > 0) {
      // Set all activities as selected by default
      const allActivityIds = activities.map(activity => activity.id)
      setSelectedActivities(allActivityIds)
      // Fetch report with all activities
      fetchReport()
    }
  }, [activities])
  const fetchMembers = async () => {
    try {
      console.log('Fetching members...');
      const response = await fetch(getApiUrl('Member'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setMembers(data.result.items);
      } else {
        toast.error(data.message || 'Failed to fetch members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    }
  };

  const fetchActivities = async () => {
    try {
      console.log('Fetching activities...');
      const response = await fetch(getApiUrl('Activity'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setActivities(data.result.items);
      } else {
        toast.error(data.message || 'Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to fetch activities');
    }
  };

  const fetchReport = async () => {
    if (!startDate || !endDate || selectedActivities.length === 0) {
      return; // Silently return if not ready to fetch
    }

    setLoading(true);
    try {
      const activityIds = selectedActivities.join(',');
      const url = getApiUrl(`StandardReport/attendance-report?StartDate=${startDate.toISOString()}&EndDate=${endDate.toISOString()}&ActivityIds=${activityIds}${memberId ? `&memberId=${memberId}` : ''}`);
      
      console.log('Fetching report with URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json() as ReportResponse;
      console.log('Report API response:', data);
      
      if (data.success) {
        const entries = Object.entries(data.result);
        if (memberId) {
          const memberEntries = entries.filter(([_, records]) => 
            records.some(record => record.memberId === memberId)
          ) as [string, AttendanceRecord[]][];
          
          setReportData(Object.fromEntries(memberEntries));
        } else {
          setReportData(data.result);
        }
      } else {
        // Don't show error toast on initial load
        if (selectedActivities.length > 0) {
          toast.error(data.message || 'Failed to fetch report');
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      // Don't show error toast on initial load
      if (selectedActivities.length > 0) {
        toast.error('Failed to fetch report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        ExportType: 'excel',
        ...(startDate && { StartDate: startDate.toISOString() }),
        ...(endDate && { EndDate: endDate.toISOString() }),
        ...(selectedActivities.length > 0 && { ActivityIds: selectedActivities.join(',') }),
        ...(memberId && { MemberId: memberId })
      })

      const response = await fetch(getApiUrl(`StandardReport/attendance-report/export?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to export report')
      }

      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'attendance-report.xlsx'

      // Create blob from response and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export report')
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Member Attendance Reports</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={date => {
                setStartDate(date)
                if (date && endDate) fetchReport()
              }}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={date => {
                setEndDate(date)
                if (startDate && date) fetchReport()
              }}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Activities</label>
            <div className="relative">
              <select
                multiple
                size={5}
                value={selectedActivities}
                onChange={e => setSelectedActivities(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.isArray(activities) && activities.length > 0 ? (
                  activities.map(activity => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No activities available</option>
                )}
              </select>
              <p className="mt-2 text-sm text-gray-500">
                {selectedActivities.length} activities selected
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Member</label>
            <select
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Members</option>
              {Array.isArray(members) && members.length > 0 ? (
                members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))
              ) : (
                <option disabled>No members available</option>
              )}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? (
              <span className="flex items-center">
                <LoadingSpinner className="w-5 h-5 mr-2" />
                Generating Report...
              </span>
            ) : (
              'Generate Report'
            )}
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {loading ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {reportData && Object.keys(reportData).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(reportData).map(([memberName, records]) => {
            const isExpanded = expandedMembers.has(memberName)
            return (
              <div key={memberName} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={() => toggleMember(memberName)}
                  className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors duration-200"
                >
                  <h2 className="text-xl font-semibold text-gray-800">{memberName}</h2>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {records.length} {records.length === 1 ? 'record' : 'records'}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                
                {isExpanded && records.length > 0 ? (
                  <div className="overflow-x-auto transition-all duration-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week Start</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week End</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {records.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.weekStart).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.weekEnd).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.activityName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.attendance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : isExpanded ? (
                  <div className="p-6 text-center text-gray-500">
                    No attendance records found for this period.
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500">
            No attendance records found. Please select a date range and activities to generate a report.
          </p>
        </div>
      )}
    </div>
  )
}