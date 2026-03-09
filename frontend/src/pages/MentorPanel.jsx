import { Link } from "react-router-dom";

function MentorPanel() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Mentor Panel</h1>
          <Link
            to="/dashboard"
            className="text-sm text-blue-500 hover:underline"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Assigned Students
            </h3>
            <p className="text-3xl font-extrabold text-blue-600">--</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Pending Reviews
            </h3>
            <p className="text-3xl font-extrabold text-blue-600">--</p>
          </div>
        </div>

        <div className="mt-10 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Recent Activity
          </h3>
          <p className="text-sm text-gray-500">
            No recent activity to display.
          </p>
        </div>
      </main>
    </div>
  );
}

export default MentorPanel;
