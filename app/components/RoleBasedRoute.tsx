'use client'

import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface RoleBasedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
  const { userData } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (userData && !allowedRoles.includes(userData.userType)) {
      toast.error('You do not have permission to access this page')
      router.push('/dashboard')
    }
  }, [userData, allowedRoles, router])

  if (!userData || !allowedRoles.includes(userData.userType)) {
    return null
  }

  return <>{children}</>
}
