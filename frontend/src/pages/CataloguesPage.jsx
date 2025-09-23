import { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'
import { Upload, Download, Edit, Trash2, FileText } from 'lucide-react'

export default function CataloguesPage() {
  const [catalogues, setCatalogues] = useState([])
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('catalogues')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [cataloguesResponse, downloadsResponse] = await Promise.all([
        apiService.get('/catalogue'),
        apiService.get('/admin/catalogue/downloads')
      ])

      if (cataloguesResponse.success) {
        setCatalogues(cataloguesResponse.data.catalogues)
      }
      if (downloadsResponse.success) {
        setDownloads(downloadsResponse.data.downloads)
      }
    } catch (error) {
      console.error('Error fetching catalogue data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (catalogueId) => {
    if (window.confirm('Are you sure you want to delete this catalogue?')) {
      try {
        const response = await apiService.delete(`/catalogue/${catalogueId}`)
        if (response.success) {
          fetchData() // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting catalogue:', error)
      }
    }
  }

  const handleDownload = async (catalogueId, fileName) => {
    try {
      console.log('🔥 FRONTEND DOWNLOAD CALLED:', { catalogueId, fileName })

      // Create download link
      const downloadUrl = `${import.meta.env.VITE_API_URL}/catalogue/${catalogueId}/download`

      console.log('🔥 DOWNLOAD URL:', downloadUrl)

      // Create temporary link element
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Refresh data after download to update counts
      setTimeout(() => {
        console.log('🔥 REFRESHING DATA AFTER DOWNLOAD')
        fetchData()
      }, 1000) // Wait 1 second for backend to process

    } catch (error) {
      console.error('Error downloading catalogue:', error)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage catalogue files and track downloads
          </p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center">
          <Upload className="h-4 w-4 mr-2" />
          Upload Catalogue
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('catalogues')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'catalogues'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Catalogues ({catalogues.length})
          </button>
          <button
            onClick={() => setActiveTab('downloads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'downloads'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Download History ({downloads.length})
          </button>
        </nav>
      </div>

      {/* Catalogues Tab */}
      {activeTab === 'catalogues' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Downloads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : catalogues.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No catalogues found
                    </td>
                  </tr>
                ) : (
                  catalogues.map((catalogue) => (
                    <tr key={catalogue._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {catalogue.originalName}
                            </div>
                            {catalogue.description && (
                              <div className="text-sm text-gray-500">
                                {catalogue.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(catalogue.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {catalogue.downloadCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(catalogue.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleDownload(catalogue._id, catalogue.originalName)}
                          className="text-green-600 hover:text-green-900"
                          title="Download catalogue"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="text-primary-600 hover:text-primary-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(catalogue._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Downloads Tab */}
      {activeTab === 'downloads' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Download History</h3>
              <button
                onClick={fetchData}
                className="bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 text-sm flex items-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Downloaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : downloads.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No downloads found
                    </td>
                  </tr>
                ) : (
                  downloads.map((download) => (
                    <tr key={download._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {download.userId?.name || 'Anonymous'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {download.userId?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Download className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {download.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(download.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {download.ipAddress}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
