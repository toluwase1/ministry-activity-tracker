'use client'

import React from 'react'

export default function Preloader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div className="relative">
        {/* Outer circle */}
        <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin"></div>
        {/* Inner circle */}
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin-slow"></div>
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
