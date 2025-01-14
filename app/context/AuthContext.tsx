'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '../config'
import { handleApiResponse, type ApiResponse } from '../utils/api-response'
import { toast } from 'sonner'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string, memberType: number) => Promise<void>
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const login = async (email: string, password: string, memberType: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberType: Number(memberType),
          email,
          password
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.message || `HTTP error! status: ${response.status}`
        console.error('Login failed:', errorMessage)
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (data.success) {
        localStorage.setItem('token', data.result.accessToken)
        setToken(data.result.accessToken)
        router.push('/dashboard')
        toast.success('Successfully logged in')
      } else {
        toast.error(data.message || 'Login failed')
        throw new Error(data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Failed to login')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    router.push('/login')
    toast.success('Successfully logged out')
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!token,
      login,
      logout,
      token
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
