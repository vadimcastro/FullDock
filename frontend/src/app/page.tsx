import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          {process.env.NEXT_PUBLIC_PROJECT_NAME || 'Template Project'}
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto">
          {process.env.NEXT_PUBLIC_PROJECT_DESCRIPTION || 'Project Template - Ready for Development'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Dashboard
          </Link>
          
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            API Documentation
          </a>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Frontend</h3>
            <p>Next.js 14 with TypeScript</p>
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Backend</h3>
            <p>FastAPI with PostgreSQL</p>
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Infrastructure</h3>
            <p>Docker with monitoring</p>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          Built with{' '}
          <a 
            href={process.env.NEXT_PUBLIC_TEMPLATE_REPO_URL || "https://github.com/your-org/project-template"}
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {process.env.NEXT_PUBLIC_TEMPLATE_REPO_NAME || "project-template"}
          </a>
        </div>
      </div>
    </div>
  )
}
