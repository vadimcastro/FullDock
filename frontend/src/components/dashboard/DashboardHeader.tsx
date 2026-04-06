// src/components/dashboard/DashboardHeader.tsx
interface DashboardHeaderProps {
    lastUpdated: string;
    onRefresh: () => void;
    isRefreshing: boolean;
  }
  
  export const DashboardHeader = ({
    lastUpdated,
    onRefresh,
    isRefreshing
  }: DashboardHeaderProps) => (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-semibold text-gray-900 hidden lg:block">
        Welcome to {process.env.NEXT_PUBLIC_PROJECT_DISPLAY_NAME || 'OnDeck'} Dashboard
      </h1>
      <div className="flex items-center gap-4 hidden lg:flex">
        <span className="text-sm text-gray-500">
          Last updated {lastUpdated}
        </span>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
            isRefreshing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          {isRefreshing ? (
            <div className="animate-spin rounded-full h-4 w-4 border border-gray-400 border-t-transparent"/>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>
      </div>
    </div>
  );
