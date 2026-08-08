import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../store/AuthContext";

export default function AdminBooking() {
  const { API } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refundingId, setRefundingId] = useState(null); // track refund in progress

  // Filters State
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        search,
        paymentStatus,
        bookingStatus,
      });

      const response = await fetch(
        `${API}/api/bookings/admin/bookings?${queryParams.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Error fetching admin bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, paymentStatus, bookingStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  // Refund handler
  const handleRefund = async (bookingId) => {
    if (
      !window.confirm(
        "Are you sure you want to refund this booking? This action is irreversible."
      )
    ) {
      return;
    }

    setRefundingId(bookingId);
    try {
      const res = await fetch(`${API}/api/bookings/admin/${bookingId}/refund`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Refund failed.");

      alert(data.message || "Refund processed successfully.");
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      alert(err.message);
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl">
        {/* Metric Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Revenue"
            value={`Rs${stats.totalRevenue?.toLocaleString() || 0}`}
            borderClass="border-emerald-500"
          />
          <StatCard
            title="Tickets Sold"
            value={stats.totalTicketsSold || 0}
            borderClass="border-blue-500"
          />
          <StatCard
            title="Confirmed"
            value={stats.confirmedBookings || 0}
            borderClass="border-green-500"
          />
          <StatCard
            title="Pending"
            value={stats.pendingBookings || 0}
            borderClass="border-amber-500"
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelledBookings || 0}
            borderClass="border-red-500"
          />
          {/* ❌ Removed the invalid booking.refundAmount block – it belongs in the modal */}
        </div>

        {/* Filter Controls */}
        <div className="mb-6 flex flex-wrap gap-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search TxID, User, Show..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </form>

          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={bookingStatus}
            onChange={(e) => {
              setBookingStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Booking Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex h-40 items-center justify-center text-slate-500">
            Loading bookings...
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-xs font-semibold uppercase text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Booking / Tx ID</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Show</th>
                    <th className="px-4 py-3">Tickets</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          <span className="text-slate-900">
                            #{booking._id.slice(-6)}
                          </span>
                          <div className="text-xs text-slate-400">
                            {booking.transactionId || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {booking.userId?.name || "Deleted User"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {booking.userId?.email}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {booking.showId?.name || "Deleted Show"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {booking.showId?.venue?.city || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {booking.totalTickets}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          Rs{booking.totalAmount}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            label={booking.paymentStatus}
                            status={booking.paymentStatus}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            label={booking.bookingStatus}
                            status={booking.bookingStatus}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        No bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
              <span>
                Page{" "}
                <strong className="text-slate-700">{pagination.page}</strong> of{" "}
                <strong className="text-slate-700">{pagination.pages}</strong> (
                {pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-slate-300 bg-white px-3 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-slate-300 bg-white px-3 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Modal with Refund Button */}
        {selectedBooking && (
          <BookingModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onRefund={handleRefund}
            refundingId={refundingId}
          />
        )}
      </div>
    </div>
  );
}

// Sub-components
function StatCard({ title, value, borderClass }) {
  return (
    <div
      className={`rounded-xl border-l-4 bg-white p-4 shadow-sm border border-slate-200 ${borderClass}`}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {title}
      </span>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Badge({ label, status }) {
  const getStyle = () => {
    switch (status) {
      case "paid":
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "refunded":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${getStyle()}`}
    >
      {label}
    </span>
  );
}

// BookingModal – includes refund details and the refund button
function BookingModal({ booking, onClose, onRefund, refundingId }) {
  const isRefundable =
    booking.bookingStatus === "cancelled" &&
    booking.paymentStatus === "paid" &&
    booking.refundStatus !== "processed" &&
    booking.refundStatus !== "processing";

  // Compute deduction and net refund (fallback if not stored)
  const deduction = booking.deductionAmount || (booking.totalAmount * 0.2);
  const netRefund = booking.refundAmount || (booking.totalAmount - deduction);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Booking Details (#{booking._id.slice(-6)})
            </h3>
            <p className="text-xs text-slate-400">{booking.transactionId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div>
            <strong className="text-slate-800">User:</strong>{" "}
            {booking.userId?.name} ({booking.userId?.email})
          </div>
          <div>
            <strong className="text-slate-800">Show:</strong>{" "}
            {booking.showId?.name}
          </div>
          <div>
            <strong className="text-slate-800">Organizer:</strong>{" "}
            {booking.organizerId?.organizer?.organizationName ||
              booking.organizerId?.name}
          </div>
          <div>
            <strong className="text-slate-800">Payment Status:</strong>{" "}
            <Badge
              label={booking.paymentStatus}
              status={booking.paymentStatus}
            />
          </div>
          <div>
            <strong className="text-slate-800">Booking Status:</strong>{" "}
            <Badge
              label={booking.bookingStatus}
              status={booking.bookingStatus}
            />
          </div>
          {booking.refundStatus && booking.refundStatus !== "none" && (
            <div>
              <strong className="text-slate-800">Refund Status:</strong>{" "}
              <Badge
                label={booking.refundStatus}
                status={booking.refundStatus}
              />
            </div>
          )}

          {/* 🔹 Refund breakdown – shown when refund has been processed or is processing */}
          {(booking.refundStatus === "processed" || booking.refundStatus === "processing") && (
            <>
              <hr className="my-2 border-slate-100" />
              <div className="space-y-1 text-sm">
                <div>
                  <strong className="text-slate-800">Original Amount:</strong>{" "}
                  Rs{booking.totalAmount}
                </div>
                {deduction > 0 && (
                  <div>
                    <strong className="text-slate-800">Deduction (20%):</strong>{" "}
                    <span className="text-red-600">- Rs{deduction.toFixed(2)}</span>
                  </div>
                )}
                <div className="text-base font-bold text-emerald-600">
                  <strong>Net Refund:</strong> Rs{netRefund.toFixed(2)}
                </div>
              </div>
            </>
          )}

          <hr className="my-2 border-slate-100" />

          <h4 className="font-semibold text-slate-800">
            Tickets Breakdown ({booking.tickets.length})
          </h4>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {booking.tickets.map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
              >
                <div>
                  <span className="font-mono font-semibold text-slate-800">
                    {t.ticketId}
                  </span>
                  {t.ticketType && (
                    <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-slate-700">
                      {t.ticketType}
                    </span>
                  )}
                  {t.seatNumber && (
                    <span className="ml-2 text-slate-500">
                      Seat: {t.seatNumber}
                    </span>
                  )}
                </div>
                <div>
                  {t.isCheckedIn ? (
                    <span className="font-medium text-emerald-600">
                      ✓ Checked In
                    </span>
                  ) : (
                    <span className="text-slate-400">Not Used</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {/* Refund Button - only if refundable */}
          {isRefundable && (
            <button
              onClick={() => onRefund(booking._id)}
              disabled={refundingId === booking._id}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {refundingId === booking._id ? "Refunding..." : "Process Refund"}
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}