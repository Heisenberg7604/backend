import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/UsersPage'
import ActivitiesPage from './pages/ActivitiesPage'
import CataloguesPage from './pages/CataloguesPage'
import NewsletterPage from './pages/NewsletterPage'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Show blank screen for root and other routes */}
        <Route path="/" element={<BlankScreen />} />
        <Route path="/*" element={<BlankScreen />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/*" element={<ProtectedRoutes />} />
      </Routes>
    </AuthProvider>
  )
}

function BlankScreen() {
  return (
    <div className="w-full h-screen bg-white">
      {/* Completely blank white screen */}
    </div>
  )
}

function ProtectedRoutes() {
  const { isAuthenticated, loading } = useAuth()

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/catalogues" element={<CataloguesPage />} />
        <Route path="/newsletter" element={<NewsletterPage />} />
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
