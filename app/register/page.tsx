'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_BASE_URL } from '../config'
import Preloader from '../components/Preloader'
import { handleApiResponse, type ApiResponse } from '../utils/api-response'
import { toast } from 'sonner'

// Helper function to construct API URLs correctly
const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_BASE_URL.endsWith('/api') 
    ? API_BASE_URL.slice(0, -4) 
    : API_BASE_URL;
  return `${baseUrl}/api/${endpoint.replace(/^\/+/, '')}`;
};

interface Fellowship {
  id: string;
  name: string;
  pastorId: string;
  pastorFullName: string | null;
}

interface FellowshipResponse {
  result: {
    items: Fellowship[];
    totalCount: number;
  };
  success: boolean;
  message: string;
  validationErrors: null | any;
}

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [fellowshipId, setFellowshipId] = useState('')
  const [fellowships, setFellowships] = useState<Fellowship[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchFellowships = async () => {
      try {
        console.log('Fetching fellowships...');
        const response = await fetch(getApiUrl('Fellowship'), {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const data: ApiResponse<{ items: Fellowship[]; totalCount: number }> = await response.json();
        console.log('Fellowships response:', data);
        
        if (data.success && data.result?.items) {
          // Sort fellowships by name for better UX
          const sortedFellowships = [...data.result.items].sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          setFellowships(sortedFellowships);
        } else {
          handleApiResponse(data);
        }
      } catch (err) {
        console.error('Error fetching fellowships:', err);
        toast.error('Failed to load fellowships. Please refresh the page.');
      }
    };

    fetchFellowships();
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fellowshipId) {
      toast.error('Please select a fellowship');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const requestData = {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        memberType: "WorkersInTraining",
        fellowshipId
      };
      
      console.log('Sending registration request:', { ...requestData, password: '***' });

      const response = await fetch(getApiUrl('Auth/Register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
      });

      const data: ApiResponse = await response.json();
      console.log('Registration response:', data);

      if (handleApiResponse(data) && response.ok) {
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {loading && <Preloader />}
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} method="POST">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="first-name" className="sr-only">
                First Name
              </label>
              <input
                id="first-name"
                type="text"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="last-name" className="sr-only">
                Last Name
              </label>
              <input
                id="last-name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone-number" className="sr-only">
                Phone Number
              </label>
              <input
                id="phone-number"
                type="tel"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="fellowship" className="sr-only">
                Fellowship
              </label>
              <select
                id="fellowship"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={fellowshipId}
                onChange={(e) => setFellowshipId(e.target.value)}
              >
                <option value="">Select your fellowship</option>
                {fellowships.map((fellowship) => (
                  <option key={fellowship.id} value={fellowship.id}>
                    {fellowship.name} {fellowship.pastorFullName ? `(Pastor: ${fellowship.pastorFullName})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Register
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
