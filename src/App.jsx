import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import TaskBoard from './components/TaskBoard'
import SideBar from './components/SideBar'

function ProtectedRoute({ session }) {
  if (!session) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function Layout() {
  return (
    <div className="flex h-screen bg-background text-text overflow-hidden">
      <SideBar />
      <main className="flex-1 overflow-auto p-8 relative">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-text p-4">
        <div className="w-full max-w-md p-8 bg-surface rounded-lg border border-red-500/20 shadow-xl">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Configuration Error</h1>
          <p className="text-gray-300 mb-4">
            Supabase configuration is missing. The application cannot start.
          </p>
          <div className="bg-black/30 p-4 rounded text-sm font-mono text-gray-400 mb-6">
            <p>Please create a <span className="text-white">.env</span> file in the project root with the following keys:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
          <p className="text-sm text-gray-500">
            Check the README.md or .env.example for details.
          </p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background text-primary">Loading...</div>
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />

        <Route element={<ProtectedRoute session={session} />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/board" element={<TaskBoard />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App
