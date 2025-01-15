'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '../config'
import { handleApiResponse, type ApiResponse } from '../utils/api-response'
import { getApiUrl } from '../utils/api-url'
import { toast } from 'sonner'

interface AuthContextType {
  isAuthenticated: boolean
  login: (token: string) => Promise<void>
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for token on mount
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const login = async (token: string) => {
    try {
      if (!token) {
        throw new Error('No token provided')
      }
      localStorage.setItem('token', token)
      setToken(token)
      // Navigate to dashboard after successful login
      router.replace('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Failed to save login information')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    router.replace('/login')
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
