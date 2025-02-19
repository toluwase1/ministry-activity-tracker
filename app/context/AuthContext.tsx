'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '../config'
import { handleApiResponse, type ApiResponse } from '../utils/api-response'
import { getApiUrl } from '../utils/api-url'
import { toast } from 'sonner'

interface UserData {
  userId: string
  groupId: string
  fullName: string
  phoneNumber: string
  emailAddress: string
  userType: string
  groupName: string
  lastLoginDate: string | null
}

interface LoginResponse {
  accessToken: string
  refreshToken: string | null
  expiredAt: string
  userData: UserData
}

interface AuthContextType {
  isAuthenticated: boolean
  login: (token: string, userData: UserData) => Promise<void>
  logout: () => void
  token: string | null
  userData: UserData | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Initialize token from localStorage
const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

// Initialize user data from localStorage
const getStoredUserData = () => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('userData')
    return data ? JSON.parse(data) : null
  }
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken())
  const [userData, setUserData] = useState<UserData | null>(getStoredUserData())
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const storedToken = getStoredToken()
    const storedUserData = getStoredUserData()
    if (storedToken) {
      setToken(storedToken)
    }
    if (storedUserData) {
      setUserData(storedUserData)
    }
    setIsInitialized(true)
  }, [])

  const login = async (newToken: string, newUserData: UserData) => {
    try {
      if (!newToken) {
        throw new Error('No token provided')
      }
      localStorage.setItem('token', newToken)
      localStorage.setItem('userData', JSON.stringify(newUserData))
      setToken(newToken)
      setUserData(newUserData)
      router.replace('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Failed to save login information')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    setToken(null)
    setUserData(null)
    router.replace('/login')
    toast.success('Successfully logged out')
  }

  if (!isInitialized) {
    return null
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!token,
      login,
      logout,
      token,
      userData
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
