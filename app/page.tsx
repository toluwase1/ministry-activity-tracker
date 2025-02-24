import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Saints Community Church Ministry Activity Tracker
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold mb-4">Welcome to Saints Community Church's Ministry Activity Tracker</h2>
              <p className="text-gray-600 mb-8 text-center max-w-md">
                Efficiently manage your church's activities, members, and reports with our comprehensive dashboard.
              </p>
              <div className="space-x-4">
                <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Login
                </Link>
                <Link href="/register" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

