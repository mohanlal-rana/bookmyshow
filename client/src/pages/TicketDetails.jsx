import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TicketDetails() {
  const API = import.meta.env.VITE_API;
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/bookings/${bookingId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch ticket details.");
      }

      setBooking(data.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to download QR code image
  const handleDownloadQR = (qrBase64, ticketId, index) => {
    const link = document.createElement("a");
    link.href = qrBase64;
    link.download = `Ticket_${index + 1}_${ticketId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] flex items-center justify-center p-6">
        <div className="text-xl font-semibold text-[#34908B] flex items-center gap-3">
          <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#34908B]"></span>
          Loading tickets...
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] p-6 flex items-center justify-center">
        <div className="bg-white text-red-600 border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Error Loading Ticket</h2>
          <p className="text-sm text-gray-600 mb-6">{error || "Booking not found"}</p>
          <button
            onClick={() => navigate("/my-bookings")}
            className="bg-[#34908B] text-white px-5 py-2.5 rounded-xl hover:bg-[#2b7873] transition font-medium"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  const show = booking.showId || {};

  return (
    <div className="min-h-screen bg-[#FDF4AF] py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate("/my-bookings")}
            className="flex items-center gap-2 text-[#34908B] font-bold hover:underline"
          >
            ← Back to My Bookings
          </button>
          
          <button
            onClick={() => window.print()}
            className="bg-white border border-[#8ce0d2] text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition shadow-sm"
          >
            🖨️ Print All Tickets
          </button>
        </div>

        {/* Event Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#8ce0d2] shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold bg-[#A5E9DD] text-[#0f3d3a] px-3 py-1 rounded-full uppercase tracking-wider">
              {show.genre || "Event Pass"}
            </span>
            <h1
              onClick={() => navigate(`/event/${show._id}`)}
              className="text-2xl font-extrabold text-[#34908B] mt-2 cursor-pointer hover:underline"
            >
              {show.name || show.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              📍 {show.venue?.name}, {show.venue?.city}
            </p>
          </div>

          <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
            <span className="text-xs text-gray-400 uppercase font-bold block">
              Booking Ref
            </span>
            <span className="font-mono text-sm font-bold text-gray-700">
              #{booking._id}
            </span>
            <p className="text-xs text-green-600 font-bold mt-1">
              ✓ {booking.paymentStatus.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">
            Your QR Passes ({booking.tickets?.length || 0})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {booking.tickets?.map((t, index) => (
              <div
                key={t._id || t.ticketId || index}
                className="bg-white rounded-2xl border border-[#8ce0d2] shadow-md p-6 flex flex-col items-center justify-between space-y-4 hover:shadow-lg transition"
              >
                <div className="w-full flex justify-between items-center border-b pb-3">
                  <span className="text-sm font-bold text-[#34908B]">
                    Ticket #{index + 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      t.isCheckedIn
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {t.isCheckedIn ? "Checked In" : "Valid Pass"}
                  </span>
                </div>

                {/* QR Display */}
                {t.qrCode ? (
                  <div className="bg-white p-3 border rounded-xl shadow-inner flex flex-col items-center">
                    <img
                      src={t.qrCode}
                      alt={`Ticket QR Code ${index + 1}`}
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded-xl">
                    No QR Code Generated
                  </div>
                )}

                {/* Info & Download Action */}
                <div className="w-full space-y-3 text-center">
                  <div className="text-xs text-gray-500 font-mono">
                    ID: {t.ticketId || t._id}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">
                    Price: Rs. {t.price}
                  </div>

                  <button
                    onClick={() => handleDownloadQR(t.qrCode, t.ticketId || t._id, index)}
                    disabled={!t.qrCode}
                    className="w-full bg-[#34908B] hover:bg-[#2b7873] disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>📥</span> Download QR Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}