import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../store/AuthContext";

export default function EventManagementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { API } = useContext(AuthContext);

  const [show, setShow] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    confirmedRevenue: 0,
    cancellationFeeRevenue: 0,
    confirmedCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    refundedCount: 0,
    totalRefundedAmount: 0,
    grossRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action states
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionError, setActionError] = useState("");

  // Booking Filtering States
  const [bookingSearch, setBookingSearch] = useState("");
  const [selectedBookingStatus, setSelectedBookingStatus] = useState("all");
  const [inspectBooking, setInspectBooking] = useState(null);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/shows/admin/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch event details.");
      }

      setShow(data.show);
      setBookings(data.bookings || []);
      if (data.revenueStats) {
        // Ensure all fields exist with defaults
        setRevenueStats({
          totalRevenue: data.revenueStats.totalRevenue ?? 0,
          confirmedRevenue: data.revenueStats.confirmedRevenue ?? 0,
          cancellationFeeRevenue: data.revenueStats.cancellationFeeRevenue ?? 0,
          confirmedCount: data.revenueStats.confirmedCount ?? 0,
          pendingAmount: data.revenueStats.pendingAmount ?? 0,
          pendingCount: data.revenueStats.pendingCount ?? 0,
          refundedCount: data.revenueStats.refundedCount ?? 0,
          totalRefundedAmount: data.revenueStats.totalRefundedAmount ?? 0,
          grossRevenue: data.revenueStats.grossRevenue ?? 0,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Event Verification
  const handleToggleVerify = async () => {
    try {
      setIsVerifying(true);
      setActionError("");

      const res = await fetch(`${API}/api/shows/admin/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update verification status.");
      }

      if (data.show) {
        setShow(data.show);
      } else {
        setShow((prev) => ({
          ...prev,
          isVerified: typeof data.isVerified === "boolean" ? data.isVerified : !prev.isVerified,
        }));
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Delete Show
  const handleDeleteShow = async () => {
    try {
      setIsDeleting(true);
      setActionError("");

      const res = await fetch(`${API}/api/shows/admin/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete show.");
      }

      navigate(-1);
    } catch (err) {
      setActionError(err.message);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter Bookings by Search & Status
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.userId?.name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.userId?.email?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.transactionId?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b._id.toLowerCase().includes(bookingSearch.toLowerCase());

    const matchesStatus =
      selectedBookingStatus === "all" || b.bookingStatus === selectedBookingStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#34908B] font-bold text-lg bg-white px-6 py-4 rounded-xl shadow-sm border border-[#8ce0d2]">
          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#34908B]"></span>
          Loading Event Details...
        </div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md border border-red-200 text-center max-w-lg mx-auto my-8">
        <h2 className="text-xl font-bold text-red-600">Event Not Found</h2>
        <p className="text-sm text-gray-600 mt-2">{error || "Unable to retrieve event information."}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-5 bg-[#34908B] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#2b7873] transition"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const total = show.totalTickets || 1;
  const sold = show.soldTickets || 0;
  const salesPercent = Math.min(100, Math.round((sold / total) * 100));
  const maxPossibleRevenue = (show.price || 0) * total;

  const bannerSrc = show.bannerImage
    ? show.bannerImage.startsWith("http")
      ? show.bannerImage
      : `${API}/${show.bannerImage.replace(/^\/+/, "")}`
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-bold text-[#34908B] hover:underline flex items-center gap-1 self-start"
        >
          ← Back to Events List
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase ${
              show.status === "published"
                ? "bg-green-100 text-green-700"
                : show.status === "cancelled"
                ? "bg-red-100 text-red-700"
                : show.status === "completed"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {show.status}
          </span>

          <button
            onClick={handleToggleVerify}
            disabled={isVerifying}
            className={`text-xs font-bold px-4 py-1.5 rounded-full transition shadow-sm flex items-center gap-1.5 ${
              show.isVerified
                ? "bg-teal-100 text-[#34908B] border border-teal-300 hover:bg-teal-200"
                : "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
            }`}
          >
            {isVerifying ? (
              <span className="animate-spin h-3 w-3 border-b-2 border-current rounded-full" />
            ) : show.isVerified ? (
              "✓ Verified (Click to Unverify)"
            ) : (
              "⚠️ Unverified (Click to Verify)"
            )}
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-xs font-bold px-4 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition shadow-sm"
          >
            🗑️ Delete Show
          </button>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")} className="font-bold text-red-900 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Show Card */}
      <div className="bg-white rounded-2xl shadow-md border border-[#8ce0d2] overflow-hidden">
        <div className="relative h-64 md:h-80 bg-gray-900 overflow-hidden">
          {bannerSrc ? (
            <img src={bannerSrc} alt={show.name} className="w-full h-full object-cover opacity-90" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold text-sm">
              No Banner Image Available
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="bg-[#34908B] text-xs font-bold px-3 py-1 rounded-full uppercase">
              {show.genre}
            </span>
            <h1 className="text-3xl font-extrabold mt-2 drop-shadow-md">{show.name}</h1>
            <p className="text-sm opacity-90 mt-1">📍 {show.venue?.name}, {show.venue?.city}</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-[#FDF4AF]/40 p-4 rounded-xl border border-yellow-200">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Revenue
              </span>
              <p className="text-xl font-black text-emerald-600">
                Rs. {revenueStats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Ticket Price
              </span>
              <p className="text-xl font-black text-[#34908B]">Rs. {show.price}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Tickets Sold
              </span>
              <p className="text-xl font-black text-gray-800">{show.soldTickets} / {show.totalTickets}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Available
              </span>
              <p className="text-xl font-black text-green-600">{show.availableTickets}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Views
              </span>
              <p className="text-xl font-black text-blue-600">👁️ {show.views || 0}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-gray-600">Capacity Filled ({salesPercent}%)</span>
              <span className="text-[#34908B]">{show.availableTickets} Remaining</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
              <div
                className="bg-[#34908B] h-3 rounded-full transition-all duration-500"
                style={{ width: `${salesPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Financial Overview Card - Updated to use new stats */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              💰 Revenue Summary & Financial Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                <span className="text-gray-500 block">Net Revenue (Earned)</span>
                <span className="text-lg font-extrabold text-emerald-700">
                  Rs. {revenueStats.totalRevenue.toLocaleString()}
                </span>
                <div className="text-[10px] text-gray-400 space-y-0.5 mt-1">
                  <div>Confirmed: Rs. {revenueStats.confirmedRevenue.toLocaleString()}</div>
                  <div>Cancellation Fees: Rs. {revenueStats.cancellationFeeRevenue.toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                <span className="text-gray-500 block">Pending Payments</span>
                <span className="text-lg font-extrabold text-amber-600">
                  Rs. {revenueStats.pendingAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  From {revenueStats.pendingCount} unconfirmed booking(s)
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                <span className="text-gray-500 block">Max Potential Revenue</span>
                <span className="text-lg font-extrabold text-blue-700">
                  Rs. {maxPossibleRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  If 100% capacity ({total} tickets) sells out
                </span>
              </div>
            </div>

            {/* Optional: Refunded totals info */}
            {revenueStats.totalRefundedAmount > 0 && (
              <div className="text-xs text-gray-500 bg-white/70 p-2 rounded-lg border border-gray-200">
                <strong>Refunded Amount (full):</strong> Rs. {revenueStats.totalRefundedAmount.toLocaleString()} from {revenueStats.refundedCount} cancelled booking(s)
              </div>
            )}
          </div>

          {/* Detailed Info Grid - remains the same */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  📅 Event Timing
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl space-y-1 text-sm border">
                  <p><strong className="text-gray-700">Date:</strong> {formatDate(show.date)}</p>
                  <p><strong className="text-gray-700">Hours:</strong> {show.startTime} - {show.endTime}</p>
                  {show.bookingDeadline && (
                    <p className="text-red-600 font-medium text-xs mt-2">
                      ⏰ Booking Deadline: {formatDate(show.bookingDeadline)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  📍 Venue Details
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl space-y-1 text-sm border">
                  <p className="font-bold text-gray-800">{show.venue?.name}</p>
                  <p className="text-gray-600">{show.venue?.address}</p>
                  <p className="text-gray-600">{show.venue?.city}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  🛡️ Rules & Settings
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Tickets / User:</span>
                    <span className="font-bold text-gray-800">{show.maxTicketsPerUser}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">QR Check-in:</span>
                    <span className="font-bold text-gray-800">{show.qrEnabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <span className="text-gray-500 text-xs block">Refund Policy:</span>
                    <p className="text-gray-700 font-medium text-xs mt-0.5">{show.refundPolicy}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  👤 Organizer Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl text-sm border">
                  {typeof show.organizerId === "object" && show.organizerId !== null ? (
                    <div>
                      <p className="font-bold text-gray-800">{show.organizerId.name || "N/A"}</p>
                      <p className="text-xs text-gray-500">{show.organizerId.email || "N/A"}</p>
                    </div>
                  ) : (
                    <p className="text-gray-600 font-mono text-xs">ID: {show.organizerId}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  📝 Event Description
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl text-sm border text-gray-700 leading-relaxed whitespace-pre-line">
                  {show.description}
                </div>
              </div>

              {show.artists && show.artists.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    🎤 Performing Artists
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {show.artists.map((artist, idx) => (
                      <div
                        key={artist._id || idx}
                        className="flex items-center gap-2 bg-gray-50 border px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700"
                      >
                        {artist.image && (
                          <img src={artist.image} alt={artist.name} className="w-5 h-5 rounded-full object-cover" />
                        )}
                        <span>{artist.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {show.tags && show.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    🏷️ Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {show.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-teal-50 text-[#34908B] border border-teal-200 text-xs px-2.5 py-0.5 rounded-md font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SHOW BOOKINGS & ATTENDEES SECTION ================= */}
      <div className="bg-white rounded-2xl shadow-md border border-[#8ce0d2] p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-800">🎟️ Bookings & Attendees</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Total {bookings.length} booking transaction(s) recorded for this show
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search user, TxID..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              className="text-xs border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-[#34908B]"
            />
            <select
              value={selectedBookingStatus}
              onChange={(e) => setSelectedBookingStatus(e.target.value)}
              className="text-xs border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-[#34908B]"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b">
              <tr>
                <th className="px-4 py-3">Booking / Tx ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Tickets</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Booking Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-gray-800">
                      #{b._id.slice(-6)}
                      <div className="text-[10px] text-gray-400 font-sans">{b.transactionId || "No TxID"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-800">{b.userId?.name || "Deleted User"}</div>
                      <div className="text-gray-500 text-[11px]">{b.userId?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-700">{b.totalTickets}</td>
                    <td className="px-4 py-3 font-bold text-[#34908B]">Rs. {b.totalAmount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold capitalize text-[10px] ${
                          b.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : b.paymentStatus === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold capitalize text-[10px] ${
                          b.bookingStatus === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : b.bookingStatus === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setInspectBooking(b)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg font-bold text-[11px] transition"
                      >
                        View Tickets
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-400">
                    No bookings found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Ticket Details Modal */}
      {inspectBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Booking #{inspectBooking._id.slice(-6)}
                </h3>
                <p className="text-xs text-gray-500">
                  Booked on: {new Date(inspectBooking.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setInspectBooking(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <p><strong>Customer:</strong> {inspectBooking.userId?.name} ({inspectBooking.userId?.email})</p>
              <p><strong>Total Paid:</strong> <span className="font-bold text-[#34908B]">Rs. {inspectBooking.totalAmount}</span></p>
              <p><strong>Payment Method:</strong> {inspectBooking.paymentMethod || "N/A"}</p>
              <p><strong>Transaction ID:</strong> {inspectBooking.transactionId || "N/A"}</p>
            </div>

            <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider pt-2">
              Issued Tickets ({inspectBooking.tickets.length})
            </h4>

            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {inspectBooking.tickets.map((ticket, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 border p-3 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-gray-800">{ticket.ticketId}</span>
                    {ticket.ticketType && (
                      <span className="ml-2 bg-teal-50 text-[#34908B] border border-teal-200 px-1.5 py-0.5 rounded text-[10px]">
                        {ticket.ticketType}
                      </span>
                    )}
                    {ticket.seatNumber && (
                      <span className="ml-2 text-gray-500">Seat: {ticket.seatNumber}</span>
                    )}
                  </div>
                  <div>
                    {ticket.isCheckedIn ? (
                      <span className="text-emerald-600 font-bold text-[10px]">✓ Checked In</span>
                    ) : (
                      <span className="text-gray-400 text-[10px]">Not Checked In</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setInspectBooking(null)}
                className="bg-gray-800 hover:bg-gray-900 text-white text-xs px-4 py-2 rounded-xl font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <h3 className="text-xl font-bold text-red-600">Delete Event</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete <strong>"{show.name}"</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteShow}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-sm flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin h-3 w-3 border-b-2 border-white rounded-full" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}