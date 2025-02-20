'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UserData {
  id: string
  email: string
  fullName: string
  role: string
  userType: string
  groupName: string
  lastLoginDate: string | null
  expiredAt: string
}

interface LoginResponse {
  success: boolean
  message: string
  result: UserData
}

interface AuthContextType {
  isAuthenticated: boolean
  login: (token: string, userData: UserData) => Promise<void>
  logout: () => void
  token: string | null
  userData: UserData | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

const getStoredUserData = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('userData')
    return userData ? JSON.parse(userData) : null
  }
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // Helper function to check if a token is expired
  const isTokenExpired = (expiredAtStr: string) => {
    // Parse the UTC expiration time
    const expiredAt = new Date(expiredAtStr)
    const now = new Date()
    
    // Convert both to UTC timestamps for comparison
    return now.getTime() > expiredAt.getTime()
  }

  useEffect(() => {
    const storedToken = getStoredToken()
    const storedUserData = getStoredUserData()
    
    if (storedToken && storedUserData?.expiredAt) {
      if (isTokenExpired(storedUserData.expiredAt)) {
        // Token is expired, clear storage and redirect to login
        console.log('Token expired, logging out')
        localStorage.removeItem('token')
        localStorage.removeItem('userData')
        router.push('/login')
      } else {
        // Token is still valid
        setToken(storedToken)
        setUserData(storedUserData)
        
        // Set up expiration timer
        const expiredAt = new Date(storedUserData.expiredAt).getTime()
        const now = new Date().getTime()
        const timeUntilExpiry = expiredAt - now
        
        if (timeUntilExpiry > 0) {
          setTimeout(() => {
            console.log('Token expired via timer')
            logout()
            router.push('/login')
          }, timeUntilExpiry)
        }
      }
    }
    setIsInitialized(true)
  }, [router])

  // Check token expiration before any authenticated action
  const checkTokenExpiration = () => {
    if (userData?.expiredAt) {
      if (isTokenExpired(userData.expiredAt)) {
        console.log('Token expired during check')
        logout()
        router.push('/login')
        return false
      }
    }
    return true
  }

  const login = async (newToken: string, newUserData: UserData) => {
    try {
      localStorage.setItem('token', newToken)
      localStorage.setItem('userData', JSON.stringify(newUserData))
      
      setToken(newToken)
      setUserData(newUserData)
      
      // Set up expiration timer only if token isn't already expired
      if (!isTokenExpired(newUserData.expiredAt)) {
        const expiredAt = new Date(newUserData.expiredAt).getTime()
        const now = new Date().getTime()
        const timeUntilExpiry = expiredAt - now
        
        if (timeUntilExpiry > 0) {
          setTimeout(() => {
            console.log('Token expired via login timer')
            logout()
            router.push('/login')
          }, timeUntilExpiry)
        }
      }
      
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
      isAuthenticated: !!token && checkTokenExpiration(),
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
