import { Inter } from 'next/font/google'
import { useEffect } from 'react'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Church Reporting Dashboard',
  description: 'A dashboard for managing church reports and activities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        console.error('CSP Violation:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        })
      })
    }
  }, [])

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}