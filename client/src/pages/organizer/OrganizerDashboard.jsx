import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../store/AuthContext.jsx";
import {
  Calendar,
  Ticket,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Search,
  Filter,
} from "lucide-react";

export default function OrganizerDashboard() {
  const { API } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ stats: {}, shows: [], bookings: [] });
  const [activeTab, setActiveTab] = useState("overview");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API}/api/organizer/dashboard`, {
        method: "GET",
        credentials: "include",
      });
      const result = await res.json();
      if (res.ok) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
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

  const filteredBookings = data.bookings.filter((b) => {
    const matchesFilter = bookingFilter === "all" || b.bookingStatus === bookingFilter;
    const matchesSearch =
      b.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.showId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b._id.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#34908B] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Organizer Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your events, track revenue, and monitor live audience bookings.
          </p>
        </div>
        <a
          href="/create-show"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#34908B] hover:bg-[#2b7874] text-white font-medium rounded-xl shadow-sm transition duration-200"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </a>
      </div>

      {/* Primary Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              {/* <DollarSign className="w-5 h-5" /> */}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.stats?.totalRevenue)}
          </div>
          <div className="flex items-center text-xs text-emerald-600 font-medium gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Confirmed Paid Bookings</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Tickets Sold
            </span>
            <div className="p-2.5 bg-teal-50 text-[#34908B] rounded-xl">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.stats?.totalTicketsSold || 0}
          </div>
          <p className="text-xs text-gray-400">
            Available across all events: {data.stats?.totalTicketsAvailable || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.stats?.totalBookings || 0}</div>
          <p className="text-xs text-gray-400">
            {data.stats?.confirmedBookingsCount || 0} Confirmed Payments
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Active Events
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.stats?.activeShowsCount || 0}
          </div>
          <p className="text-xs text-gray-400">Total Created: {data.shows?.length || 0}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {["overview", "events", "bookings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-semibold capitalize border-b-2 transition duration-150 ${
                activeTab === tab
                  ? "border-[#34908B] text-[#34908B]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Shows Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Shows</h2>
              <button
                onClick={() => setActiveTab("events")}
                className="text-xs font-medium text-[#34908B] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.shows.slice(0, 4).map((show) => {
                const percentage = Math.round(
                  (show.soldTickets / (show.totalTickets || 1)) * 100
                );
                return (
                  <div
                    key={show._id}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-50 text-[#34908B]">
                        {show.genre}
                      </span>
                      <span
                        className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
                          show.status === "published"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {show.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 truncate">{show.name}</h3>
                    <p className="text-xs text-gray-500">
                      {formatDate(show.date)} • {show.venue?.city}
                    </p>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs text-gray-600 font-medium">
                        <span>Tickets Sold</span>
                        <span>
                          {show.soldTickets} / {show.totalTickets} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#34908B] h-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Recent Bookings
            </h2>
            <div className="space-y-4 max-h-[380px] overflow-y-auto">
              {data.bookings.slice(0, 6).map((booking) => (
                <div key={booking._id} className="flex items-center justify-between text-sm">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-gray-900">
                      {booking.userId?.name || "Customer"}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[160px]">
                      {booking.showId?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(booking.totalAmount)}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        booking.paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {booking.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Events */}
      {activeTab === "events" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">All Created Shows</h2>
            <span className="text-xs text-gray-500">{data.shows.length} Total Events</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4">Event Name</th>
                  <th className="p-4">Genre</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Tickets Sold</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {data.shows.map((show) => (
                  <tr key={show._id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900">{show.name}</td>
                    <td className="p-4">{show.genre}</td>
                    <td className="p-4">
                      {formatDate(show.date)} ({show.startTime})
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(show.price)}</td>
                    <td className="p-4">
                      {show.soldTickets} / {show.totalTickets}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                          show.status === "published"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {show.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Detailed Bookings Table */}
      {activeTab === "bookings" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-6">
          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search user, event or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#34908B]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-sm font-medium rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#34908B]"
              >
                <option value="all">All Bookings</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Tickets</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-medium text-gray-900">
                      {b.userId?.name || "N/A"}
                      <span className="block text-xs font-normal text-gray-400">
                        {b.userId?.email}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900">{b.showId?.name || "N/A"}</td>
                    <td className="p-4 font-semibold">{b.totalTickets}</td>
                    <td className="p-4 font-bold text-gray-900">{formatCurrency(b.totalAmount)}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold capitalize px-2 py-0.5 rounded-md ${
                          b.paymentStatus === "paid"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {b.paymentStatus === "paid" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-semibold capitalize px-2.5 py-1 rounded-full ${
                          b.bookingStatus === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.bookingStatus === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">{formatDate(b.createdAt)}</td>
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