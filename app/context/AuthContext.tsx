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

// Initialize token from localStorage
const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken())
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const storedToken = getStoredToken()
    if (storedToken) {
      setToken(storedToken)
    }
    setIsInitialized(true)
  }, [])

  const login = async (newToken: string) => {
    try {
      if (!newToken) {
        throw new Error('No token provided')
      }
      localStorage.setItem('token', newToken)
      setToken(newToken)
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

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return null
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
