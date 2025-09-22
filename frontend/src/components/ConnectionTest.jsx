import { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'

export default function ConnectionTest() {
    const [connectionStatus, setConnectionStatus] = useState('Testing...')
    const [backendData, setBackendData] = useState(null)

    useEffect(() => {
        testConnection()
    }, [])

    const testConnection = async () => {
        try {
            const response = await apiService.get('/health')
            if (response.success) {
                setConnectionStatus('✅ Connected')
                setBackendData(response.data)
            } else {
                setConnectionStatus('❌ Connection Failed')
            }
        } catch (error) {
            setConnectionStatus('❌ Connection Failed')
            console.error('Connection test failed:', error)
        }
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Backend Connection Test</h2>
            <div className="space-y-2">
                <p><strong>Status:</strong> {connectionStatus}</p>
                <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}</p>
                {backendData && (
                    <div className="mt-4">
                        <p><strong>Backend Status:</strong> {backendData.status}</p>
                        <p><strong>Environment:</strong> {backendData.environment}</p>
                        <p><strong>Uptime:</strong> {Math.round(backendData.uptime)}s</p>
                    </div>
                )}
                <button
                    onClick={testConnection}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Test Again
                </button>
            </div>
        </div>
    )
}
