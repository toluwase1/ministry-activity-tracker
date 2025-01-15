'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import Preloader from '../components/Preloader'
import { handleApiResponse, type ApiResponse } from '../utils/api-response'
import { getApiUrl } from '../utils/api-url'
import { toast } from 'sonner'

interface LoginResponse {
  accessToken: string;
  refreshToken: string | null;
  expiredAt: string;
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [memberType, setMemberType] = useState(0) // Default to Pastor (0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  // Show registration success message only once when component mounts
  useEffect(() => {
    if (searchParams?.get('registered') === 'true') {
      toast.success('Registration successful! Please log in.')
      // Remove the registered parameter from URL to prevent showing the message again
      const url = new URL(window.location.href)
      url.searchParams.delete('registered')
      window.history.replaceState({}, '', url)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(getApiUrl('Auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          memberType: Number(memberType), // Ensure memberType is sent as a number
        }),
      })

      const data: ApiResponse<LoginResponse> = await response.json()
      console.log('Login response:', data)

      if (!data.success) {
        toast.error(data.message || 'Login failed')
        return
      }

      if (response.ok && data.result?.accessToken) {
        await login(data.result.accessToken)
        // After successful login, navigate to dashboard
        router.push('/dashboard')
        toast.success('Successfully logged in')
      } else {
        toast.error('Invalid response from server: No access token received')
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error('Failed to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {loading && <Preloader />}
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} method="POST">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="member-type" className="block text-sm font-medium text-gray-700">
              Member Type
            </label>
            <select
              id="member-type"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={memberType}
              onChange={(e) => setMemberType(Number(e.target.value))}
            >
              <option value={0}>Pastor</option>
              <option value={1}>Workers In Training</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? (
                <Preloader />
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
