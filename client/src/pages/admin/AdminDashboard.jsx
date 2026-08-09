import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../store/AuthContext.jsx";
import {
  Users,
  Calendar,
  DollarSign,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  Ban,
  Activity,
  Ticket,
} from "lucide-react";

export default function AdminDashboard() {
  const { API } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {},
    pendingOrganizersList: [],
    recentUsers: [],
    recentShows: [],
    recentBookings: [],
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch(`${API}/api/admin/dashboard`, {
        method: "GET",
        credentials: "include",
      });
      const result = await res.json();
      if (res.ok) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOrganizer = async (id) => {
    try {
      const res = await fetch(`${API}/api/users/verify/${id}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error("Verification failed", err);
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      const res = await fetch(`${API}/api/users/toggle-active/${id}`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error("Block toggle failed", err);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "NPR" }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#34908B] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            System control center for user management, platform revenue, and event approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Activity className="w-3.5 h-3.5" /> System Healthy
          </span>
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.stats?.totalRevenue)}
          </div>
          <p className="text-xs text-emerald-600 font-medium">Platform-wide sales</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              User Base
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.stats?.totalUsers || 0}
          </div>
          <p className="text-xs text-gray-400">
            {data.stats?.totalOrganizers || 0} Registered Organizers
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Events
            </span>
            <div className="p-2.5 bg-teal-50 text-[#34908B] rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.stats?.totalShows || 0}
          </div>
          <p className="text-xs text-gray-400">
            {data.stats?.activeShows || 0} Currently Active
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.stats?.pendingOrganizers || 0}
          </div>
          <p className="text-xs text-amber-600 font-medium">Organizers awaiting verification</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {["overview", "organizers", "users", "events"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-semibold capitalize border-b-2 transition duration-150 ${
                activeTab === tab
                  ? "border-[#34908B] text-[#34908B]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab === "organizers" ? "Organizer Requests" : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Verification Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">Pending Organizer Applications</h2>
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                {data.pendingOrganizersList?.length || 0} Needs Review
              </span>
            </div>

            {data.pendingOrganizersList?.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                No pending organizer verification requests.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.pendingOrganizersList?.map((org) => (
                  <div
                    key={org._id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {org.organizer?.organizationName || org.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {org.email} • {org.phone || "No phone provided"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleVerifyOrganizer(org._id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#34908B] hover:bg-[#2b7874] text-white text-xs font-medium rounded-xl transition shadow-sm"
                    >
                      <Check className="w-4 h-4" /> Approve Verification
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Activity feed */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Recent Bookings
            </h2>
            <div className="space-y-4 max-h-[380px] overflow-y-auto">
              {data.recentBookings?.map((b) => (
                <div key={b._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{b.userId?.name || "Customer"}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[140px]">
                      {b.showId?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(b.totalAmount)}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(b.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZERS APPROVAL */}
      {activeTab === "organizers" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Organizer Verification Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase border-b border-gray-100">
                  <th className="p-4">Organization</th>
                  <th className="p-4">Contact Email</th>
                  <th className="p-4">Gov ID Type</th>
                  <th className="p-4">Gov ID Number</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {data.pendingOrganizersList?.map((org) => (
                  <tr key={org._id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900">
                      {org.organizer?.organizationName || org.name}
                    </td>
                    <td className="p-4">{org.email}</td>
                    <td className="p-4">{org.organizer?.govIDType || "N/A"}</td>
                    <td className="p-4 font-mono text-xs">{org.organizer?.govIDNumber || "N/A"}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleVerifyOrganizer(org._id)}
                        className="px-3 py-1.5 bg-[#34908B] text-white text-xs font-semibold rounded-lg hover:bg-[#2b7874]"
                      >
                        Verify & Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Platform Users</h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#34908B]"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase border-b border-gray-100">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {data.recentUsers
                  ?.filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="p-4 uppercase text-xs font-bold text-gray-500">{u.role}</td>
                      <td className="p-4 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            u.isBlocked
                              ? "bg-rose-50 text-rose-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {u.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleBlock(u._id)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
                            u.isBlocked
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {u.isBlocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EVENT CATALOG */}
      {activeTab === "events" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Published Events</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase border-b border-gray-100">
                  <th className="p-4">Event Name</th>
                  <th className="p-4">Organizer</th>
                  <th className="p-4">Genre</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Tickets Sold</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {data.recentShows?.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900">{s.name}</td>
                    <td className="p-4 text-xs font-medium">
                      {s.organizerId?.organizer?.organizationName || s.organizerId?.name || "N/A"}
                    </td>
                    <td className="p-4">{s.genre}</td>
                    <td className="p-4 font-bold">{formatCurrency(s.price)}</td>
                    <td className="p-4">
                      {s.soldTickets} / {s.totalTickets}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 capitalize">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}