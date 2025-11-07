export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600">
            © 2024 {process.env.NEXT_PUBLIC_PROJECT_NAME || 'Template Project'}. Built with{' '}
            <a 
              href="https://github.com/vadimcastro/vadim-project-template" 
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              vadim-project-template
            </a>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              API Docs
            </a>
            <a
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}