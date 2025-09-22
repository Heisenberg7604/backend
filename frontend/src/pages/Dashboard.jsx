import { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'
import ConnectionTest from '../components/ConnectionTest'
import {
    Users,
    Activity,
    Download,
    Mail,
    TrendingUp,
    UserPlus,
    FileText,
    MailOpen
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null)
    const [statsData, setStatsData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const [dashboardResponse, statsResponse] = await Promise.all([
                apiService.get('/admin/dashboard'),
                apiService.get('/admin/stats')
            ])

            if (dashboardResponse.success) {
                setDashboardData(dashboardResponse.data)
            }
            if (statsResponse.success) {
                setStatsData(statsResponse.data)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    const stats = dashboardData?.stats || {}
    const recent = dashboardData?.recent || {}

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Welcome to JP Extrusiontech Admin Panel
                </p>
            </div>

            {/* Connection Test */}
            <ConnectionTest />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="font-medium text-green-600">{stats.activeUsers || 0}</span>
                            <span className="text-gray-500"> active users</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Download className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Downloads</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.totalDownloads || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Mail className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Newsletter Subscribers</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.totalSubscribers || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="font-medium text-green-600">{stats.activeSubscribers || 0}</span>
                            <span className="text-gray-500"> active subscribers</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Activity className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Recent Activities</dt>
                                    <dd className="text-lg font-medium text-gray-900">{recent.activities?.length || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                {statsData?.userGrowth && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={statsData.userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Downloads Chart */}
                {statsData?.downloadsOverTime && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Downloads Over Time</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statsData.downloadsOverTime}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="downloads" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activities</h3>
                    <div className="mt-5">
                        <div className="flow-root">
                            <ul className="-my-5 divide-y divide-gray-200">
                                {recent.activities?.slice(0, 5).map((activity, index) => (
                                    <li key={index} className="py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <Activity className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {activity.type?.replace(/_/g, ' ').toUpperCase()}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {activity.userId?.name || 'System'} - {new Date(activity.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
