'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  success: boolean
  message: string
  result: {
    accessToken: string
    refreshToken: string | null
    expiredAt: string
    userData: UserData
  }
  validationErrors: any
}

interface AuthContextType {
  isAuthenticated: boolean
  login: (response: LoginResponse) => Promise<void>
  logout: () => void
  token: string | null
  userData: UserData | null
  tokenExpiration: string | null
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

const getStoredTokenExpiration = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tokenExpiration')
  }
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken())
  const [userData, setUserData] = useState<UserData | null>(getStoredUserData())
  const [tokenExpiration, setTokenExpiration] = useState<string | null>(getStoredTokenExpiration())
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
    const storedTokenExpiration = getStoredTokenExpiration()
    
    if (storedToken && storedUserData && storedTokenExpiration) {
      if (isTokenExpired(storedTokenExpiration)) {
        // Token is expired, clear storage and redirect to login
        console.log('Token expired, logging out')
        localStorage.removeItem('token')
        localStorage.removeItem('userData')
        localStorage.removeItem('tokenExpiration')
        router.push('/login')
      } else {
        // Token is still valid
        setToken(storedToken)
        setUserData(storedUserData)
        setTokenExpiration(storedTokenExpiration)
        
        // Set up expiration timer
        const expiredAt = new Date(storedTokenExpiration).getTime()
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
    if (tokenExpiration) {
      if (isTokenExpired(tokenExpiration)) {
        console.log('Token expired during check')
        logout()
        router.push('/login')
        return false
      }
    }
    return true
  }

  const login = async (response: LoginResponse) => {
    const { accessToken, userData: newUserData, expiredAt } = response.result
    setToken(accessToken)
    setUserData(newUserData)
    setTokenExpiration(expiredAt)
    
    localStorage.setItem('token', accessToken)
    localStorage.setItem('userData', JSON.stringify(newUserData))
    localStorage.setItem('tokenExpiration', expiredAt)
    
    // Set up token expiration timer
    const timeUntilExpiry = new Date(expiredAt).getTime() - Date.now()
    if (timeUntilExpiry > 0) {
      setTimeout(() => {
        console.log('Token expired via timer')
        logout()
        router.push('/login')
      }, timeUntilExpiry)
    }
    
    router.replace('/dashboard')
  }

  const logout = () => {
    setToken(null)
    setUserData(null)
    setTokenExpiration(null)
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    localStorage.removeItem('tokenExpiration')
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
      userData,
      tokenExpiration
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
