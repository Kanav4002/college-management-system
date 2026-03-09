import { Link } from "react-router-dom";

function AdminPanel() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Admin Panel</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Total Students
            </h3>
            <p className="text-3xl font-extrabold text-blue-600">--</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Total Mentors
            </h3>
            <p className="text-3xl font-extrabold text-blue-600">--</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Total Courses
            </h3>
            <p className="text-3xl font-extrabold text-blue-600">--</p>
          </div>
        </div>

        <div className="mt-10 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
              Add Student
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
              Add Mentor
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
              Add Course
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;
