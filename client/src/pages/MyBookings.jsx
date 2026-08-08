import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../store/AuthContext";

export default function MyBookings() {
  const { API } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/bookings`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch bookings.");
      }

      // ✅ Filter out pending bookings (unpaid/not confirmed)
      const filteredBookings = (data.bookings || []).filter(
        (b) => b.bookingStatus !== "pending" && b.paymentStatus !== "pending"
      );

      setBookings(filteredBookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if a booking can be cancelled (not cancelled, within 24h, and paid)
  const canCancel = (booking) => {
    if (booking.bookingStatus === "cancelled") return false;
    if (booking.paymentStatus !== "paid") return false;
    const created = new Date(booking.createdAt);
    const now = new Date();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking? This cannot be undone.")) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Cancellation failed.");
      }

      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? {
                ...b,
                bookingStatus: "cancelled",
                paymentStatus: data.booking?.paymentStatus || b.paymentStatus,
                refundStatus: data.booking?.refundStatus || b.refundStatus,
                cancelledAt: new Date().toISOString(),
              }
            : b
        )
      );

      alert(data.message || "Booking cancelled successfully.");
    } catch (err) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (booking) => {
    const { bookingStatus, paymentStatus, refundStatus } = booking;

    if (bookingStatus === "cancelled") {
      if (paymentStatus === "refunded" || refundStatus === "processed") {
        return (
          <span className="text-xs font-bold px-3 py-1 rounded-full capitalize bg-purple-100 text-purple-700 border border-purple-300">
            Refunded
          </span>
        );
      }
      return (
        <span className="text-xs font-bold px-3 py-1 rounded-full capitalize bg-red-100 text-red-700 border border-red-300">
          Cancelled
        </span>
      );
    }

    if (bookingStatus === "confirmed" && paymentStatus === "paid") {
      return (
        <span className="text-xs font-bold px-3 py-1 rounded-full capitalize bg-green-100 text-green-700 border border-green-300">
          Confirmed • Paid
        </span>
      );
    }

    return (
      <span className="text-xs font-bold px-3 py-1 rounded-full capitalize bg-gray-100 text-gray-700 border border-gray-300">
        {bookingStatus || "Unknown"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] flex items-center justify-center p-6">
        <div className="text-xl font-semibold text-[#34908B] flex items-center gap-3">
          <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#34908B]"></span>
          Loading your tickets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] p-6 flex items-center justify-center">
        <div className="bg-white text-red-600 border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Error Loading Tickets</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchMyBookings}
            className="bg-[#34908B] text-white px-5 py-2.5 rounded-xl hover:bg-[#2b7873] transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF4AF] py-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#34908B]">
              My Tickets
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              View your event tickets and their current status
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-[#34908B] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2b7873] transition shadow-sm"
          >
            + Explore Events
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-md border border-[#8ce0d2]">
            <div className="text-5xl mb-4">🎟️</div>
            <h3 className="text-xl font-bold text-gray-800">No Tickets Found</h3>
            <p className="text-gray-500 text-sm mt-1 mb-6">
              You haven't completed any ticket purchases yet.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#34908B] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#2b7873] transition"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const show = booking.showId || {};
              const isCancelled = booking.bookingStatus === "cancelled";
              const isRefunded = booking.paymentStatus === "refunded" || booking.refundStatus === "processed";

              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-2xl border border-[#8ce0d2] shadow-md overflow-hidden transition hover:shadow-lg"
                >
                  {/* Header */}
                  <div className="bg-[#A5E9DD]/20 border-b border-[#8ce0d2] p-4 sm:p-5 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                        Booking Ref
                      </span>
                      <span className="text-sm font-mono font-bold text-gray-700">
                        #{booking._id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(booking)}
                      <span className="text-xs text-gray-500 font-medium">
                        {formatDate(booking.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-3">
                      <h2
                        onClick={() => !isCancelled && navigate(`/event/${show._id}`)}
                        className={`text-xl font-bold text-[#34908B] ${
                          !isCancelled ? "cursor-pointer hover:underline" : "cursor-default opacity-70"
                        } inline-block`}
                      >
                        {show.name || show.title || "Event Title"}
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-800">
                            📅 Date & Time
                          </p>
                          <p>{formatDate(show.date)}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">📍 Venue</p>
                          <p>{show.venue?.name || "Venue Details TBD"}</p>
                          <p className="text-xs text-gray-500">
                            {show.venue?.city || show.venue?.address}
                          </p>
                        </div>
                      </div>

                      {/* Show refund info if applicable */}
                      {isRefunded && booking.refundAmount !== undefined && (
                        <div className="mt-2 text-sm text-gray-600 bg-purple-50 p-2 rounded-lg border border-purple-200">
                          <span className="font-semibold">Refund:</span> Rs.{booking.refundAmount}
                          {booking.deductionAmount > 0 && (
                            <span className="text-xs text-gray-500 ml-2">
                              (Deduction: Rs.{booking.deductionAmount})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Panel */}
                    <div className="bg-[#FDF4AF]/30 p-4 rounded-xl border border-yellow-200 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">
                          Summary
                        </span>
                        <div className="flex justify-between text-sm mt-1">
                          <span>Total Tickets:</span>
                          <span className="font-bold">{booking.totalTickets}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span>Amount Paid:</span>
                          <span className="font-bold text-[#34908B]">
                            Rs. {booking.totalAmount}
                          </span>
                        </div>
                      </div>

                      {/* QR button – disabled if cancelled */}
                      <button
                        onClick={() => navigate(`/booking/tickets/${booking._id}`)}
                        disabled={isCancelled}
                        className={`w-full text-sm font-semibold py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2 ${
                          isCancelled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-[#34908B] text-white hover:bg-[#2b7873]"
                        }`}
                      >
                        <span>🎟️</span>
                        {isCancelled ? "Cancelled" : "View & Download QR"}
                      </button>

                      {/* Cancel button – only if not cancelled and within 24h */}
                      {canCancel(booking) && (
                        <button
                          onClick={() => handleCancel(booking._id)}
                          disabled={cancellingId === booking._id}
                          className="w-full bg-red-500 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-red-600 transition shadow-sm flex items-center justify-center gap-2"
                        >
                          {cancellingId === booking._id ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}