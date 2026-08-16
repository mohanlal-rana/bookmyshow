import { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../store/AuthContext.jsx";

export default function EventManagement() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyingId, setVerifyingId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all"); // 'all' | 'verified' | 'unverified'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'published' | 'draft' | 'cancelled' | 'completed'

  const { API } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchShows = async () => {
    try {
      const res = await fetch(`${API}/api/shows/admin`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch shows");
      }

      setShows(data.shows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  // Handler to toggle verification status using existing /admin/:id/verify API
  const handleToggleVerification = async (showId, currentStatus) => {
    try {
      setVerifyingId(showId);
      const res = await fetch(`${API}/api/shows/admin/${showId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified: !currentStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to update verification status.",
        );
      }

      // Optimistically update local state
      setShows((prevShows) =>
        prevShows.map((s) =>
          s._id === showId ? { ...s, isVerified: !currentStatus } : s,
        ),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifyingId(null);
    }
  };

  // Client-side search and filtering logic
  const filteredShows = useMemo(() => {
    return shows.filter((show) => {
      // 1. Search Query Filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        show.name?.toLowerCase().includes(query) ||
        show.organizerId?.name?.toLowerCase().includes(query) ||
        show.organizerId?.email?.toLowerCase().includes(query) ||
        show.venue?.name?.toLowerCase().includes(query) ||
        show.venue?.city?.toLowerCase().includes(query);

      // 2. Verification Filter
      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" && show.isVerified) ||
        (verificationFilter === "unverified" && !show.isVerified);

      // 3. Status Filter
      const matchesStatus =
        statusFilter === "all" || show.status === statusFilter;

      return matchesSearch && matchesVerification && matchesStatus;
    });
  }, [shows, searchQuery, verificationFilter, statusFilter]);

  if (loading) return <p className="p-4">Loading events...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#34908B]">Event Management</h1>
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full border">
          Total Events: {filteredShows.length} / {shows.length}
        </span>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search Input */}
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search by title, organizer, email, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34908B]"
          />
        </div>

        {/* Filters */}
        <div className="w-full md:w-auto flex flex-wrap gap-3 items-center">
          {/* Verification Status Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#34908B]"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified / Pending</option>
          </select>

          {/* Event Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#34908B]"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          {/* Reset Button */}
          {(searchQuery ||
            verificationFilter !== "all" ||
            statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setVerificationFilter("all");
                setStatusFilter("all");
              }}
              className="text-xs font-semibold text-red-600 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded-xl overflow-x-auto border border-gray-100">
        <table className="w-full text-left border-collapse">
          {/* HEADER */}
          <thead className="bg-[#6FBEB2] text-white text-sm">
            <tr>
              <th className="p-3">Event</th>
              <th className="p-3">Organizer</th>
              <th className="p-3">Email</th>
              <th className="p-3">Venue</th>
              <th className="p-3">Date</th>
              <th className="p-3">Tickets</th>
              <th className="p-3">Status</th>
              <th className="p-3">Verified</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="text-sm divide-y">
            {filteredShows.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">
                  No events found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredShows.map((show) => (
                <tr key={show._id} className="hover:bg-gray-50 transition">
                  {/* EVENT NAME */}
                  <td className="p-3 font-semibold text-gray-800">
                    {show.name}
                  </td>

                  {/* ORGANIZER NAME */}
                  <td className="p-3 text-gray-700">
                    {show.organizerId?.name || "N/A"}
                  </td>

                  {/* ORGANIZER EMAIL */}
                  <td className="p-3 text-xs text-gray-500 font-mono">
                    {show.organizerId?.email || "N/A"}
                  </td>

                  {/* VENUE */}
                  <td className="p-3 text-gray-600">
                    {show.venue?.name}, {show.venue?.city}
                  </td>

                  {/* DATE */}
                  <td className="p-3 text-gray-600">
                    {show.date
                      ? new Date(show.date).toLocaleDateString()
                      : "N/A"}
                  </td>

                  {/* TICKETS */}
                  <td className="p-3 text-gray-700 font-medium">
                    {show.availableTickets}/{show.totalTickets}
                  </td>

                  {/* STATUS */}
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                        show.status === "published"
                          ? "bg-green-100 text-green-700"
                          : show.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {show.status}
                    </span>
                  </td>

                  {/* VERIFIED BADGE & TOGGLE */}
                  <td className="p-3">
                    <button
                      disabled={verifyingId === show._id}
                      onClick={() =>
                        handleToggleVerification(show._id, show.isVerified)
                      }
                      title="Click to toggle verification"
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        show.isVerified
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      <span>
                        {show.isVerified ? "✓ Verified" : "⏳ Pending"}
                      </span>
                    </button>
                  </td>

                  {/* ACTION */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => navigate(`/admin/events/${show._id}`)}
                      className="bg-[#34908B] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#2f7f7a] transition font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}