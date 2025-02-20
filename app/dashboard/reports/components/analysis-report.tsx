'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import DatePicker from 'react-datepicker'
import { getApiUrl } from '../../../utils/api-url'
import { toast } from 'sonner'
import "react-datepicker/dist/react-datepicker.css"

interface Activity {
  id: string
  name: string
}

interface AnalysisReport {
  activity: string
  frequency: number
  totalAttendees: number
  count100: number
  count75: number
  count50: number
  countBelow50: number
  membersWithDisciples: number
}

export function AnalysisReport() {
  const { token, userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    return lastMonth
  })
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [analysisData, setAnalysisData] = useState<AnalysisReport[]>([])

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(getApiUrl('Activity'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        const data = await response.json()
        if (response.ok && data.success) {
          setActivities(data.result.items || [])
          // After fetching activities, automatically fetch last month's report
          handleAnalysisReport()
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
        toast.error('Failed to load activities')
      }
    }

    if (token) {
      fetchActivities()
    }
  }, [token])

  const handleAnalysisReport = async () => {
    try {
      setLoading(true)
      
      const queryParams = new URLSearchParams()
      
      if (startDate) {
        queryParams.append('StartDate', startDate.toISOString().split('T')[0])
      }
      if (endDate) {
        queryParams.append('EndDate', endDate.toISOString().split('T')[0])
      }
      if (selectedActivities.length > 0) {
        queryParams.append('ActivityIds', selectedActivities.join(','))
      }
  

      const url = `${getApiUrl('StandardReport/analysis-report')}?${queryParams.toString()}`
      console.log('Fetching URL:', url) // Debugging line

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      console.log('Response Data:', data) // Debugging line
      
      if (response.ok && data.success) {
        setAnalysisData(data.result)
        toast.success('Analysis report generated successfully')
      } else {
        toast.error(data.message || 'Failed to generate analysis report')
      }
    } catch (error) {
      console.error('Error generating analysis report:', error)
      toast.error('Failed to generate analysis report')
    } finally {
      setLoading(false)
    }
  }

  const handleExportToExcel = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      if (startDate) {
        queryParams.append('StartDate', startDate.toISOString().split('T')[0])
      }
      if (endDate) {
        queryParams.append('EndDate', endDate.toISOString().split('T')[0])
      }
      if (selectedActivities.length > 0) {
        queryParams.append('ActivityIds', selectedActivities.join(','))
      }

      const response = await fetch(getApiUrl(`StandardReport/analysis-report/export?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'analysis-report.xlsx'
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
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Generate Analysis Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activities
            </label>
            <select
              multiple
              value={selectedActivities}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value)
                setSelectedActivities(values)
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={handleAnalysisReport}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? 'Generating...' : 'Generate Analysis'}
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {analysisData.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">Activity</th>
                    <th className="px-6 py-3 text-left">Frequency</th>
                    <th className="px-6 py-3 text-left">Total Attendees</th>
                    <th className="px-6 py-3 text-center">100%</th>
                    <th className="px-6 py-3 text-center">75%</th>
                    <th className="px-6 py-3 text-center">50%</th>
                    <th className="px-6 py-3 text-center">Below 50%</th>
                    <th className="px-6 py-3 text-center">Members With Disciples</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysisData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4">{item.activity}</td>
                      <td className="px-6 py-4">{item.frequency}</td>
                      <td className="px-6 py-4">{item.totalAttendees}</td>
                      <td className="px-6 py-4 text-center">{item.count100}</td>
                      <td className="px-6 py-4 text-center">{item.count75}</td>
                      <td className="px-6 py-4 text-center">{item.count50}</td>
                      <td className="px-6 py-4 text-center">{item.countBelow50}</td>
                      <td className="px-6 py-4 text-center">{item.membersWithDisciples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
