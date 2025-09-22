import { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'
import { Activity, Clock, User } from 'lucide-react'

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchActivities()
  }, [currentPage])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await apiService.get(`/admin/activity?page=${currentPage}`)
      if (response.success) {
        setActivities(response.data.activities)
        setTotalPages(response.data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login':
        return '🔐'
      case 'user_register':
        return '👤'
      case 'catalogue_download':
        return '📥'
      case 'newsletter_subscribe':
        return '📧'
      case 'admin_login':
        return '👨‍💼'
      default:
        return '📝'
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'login':
      case 'admin_login':
        return 'bg-blue-100 text-blue-800'
      case 'user_register':
        return 'bg-green-100 text-green-800'
      case 'catalogue_download':
        return 'bg-purple-100 text-purple-800'
      case 'newsletter_subscribe':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor user activities and system events
        </p>
      </div>

      {/* Activities List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {loading ? (
                <li className="py-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                </li>
              ) : activities.length === 0 ? (
                <li className="py-4 text-center text-gray-500">
                  No activities found
                </li>
              ) : (
                activities.map((activity) => (
                  <li key={activity._id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm">{getActivityIcon(activity.type)}</span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.type?.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityColor(activity.type)}`}>
                            {activity.type}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          {activity.userId && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {activity.userId.name || activity.userId.email}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                          {activity.ipAddress && (
                            <div className="text-xs text-gray-400">
                              IP: {activity.ipAddress}
                            </div>
                          )}
                        </div>
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            <details className="cursor-pointer">
                              <summary className="hover:text-gray-800">View Details</summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                                {JSON.stringify(activity.details, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
