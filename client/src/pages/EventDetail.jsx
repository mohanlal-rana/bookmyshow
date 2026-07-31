import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EventDetail() {
  const API = import.meta.env.VITE_API;
  const { id } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState(1);

  useEffect(() => {
    const fetchShowDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API}/api/shows/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch event details.");
        }

        setShow(data.show);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShowDetail();
  }, [API, id]);

  const handleBooking = () => {
    // Navigate to booking page or trigger checkout flow
    navigate(`/shows/${id}/book`, {
      state: { quantity: ticketQuantity, show },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] flex items-center justify-center p-6">
        <div className="text-xl font-semibold text-[#34908B]">
          Loading event details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] p-6 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-8 max-w-lg text-center shadow-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Event</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-[#34908B] text-white px-5 py-2 rounded-lg hover:bg-[#2b7873] transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] p-6 flex items-center justify-center">
        <div className="text-center text-gray-700">Event not found.</div>
      </div>
    );
  }

  const maxSelectable = Math.min(
    show.maxTicketsPerUser || 5,
    show.availableTickets || 0
  );

  return (
    <div className="min-h-screen bg-[#FDF4AF] py-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-[#8ce0d2]">
        
        {/* Banner Image */}
        {show.bannerImage ? (
          <img
            src={
              show.bannerImage.startsWith("http")
                ? show.bannerImage
                : `${API}/${show.bannerImage}`
            }
            alt={show.name}
            className="w-full h-80 md:h-96 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-r from-[#34908B] to-[#2b7873] flex items-center justify-center text-white font-bold text-3xl p-6 text-center">
            {show.name}
          </div>
        )}

        <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-[#A5E9DD] text-[#0f3d3a] text-xs font-semibold px-3 py-1 rounded-full">
                  {show.genre}
                </span>
                {show.isVerified && (
                  <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Verified Event
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-[#34908B]">
                {show.name}
              </h1>

              {show.organizerId?.name && (
                <p className="text-sm text-gray-500 mt-1">
                  Organized by{" "}
                  <span className="font-semibold text-gray-700">
                    {show.organizerId.name}
                  </span>
                </p>
              )}
            </div>

            {/* Event Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                About the Event
              </h2>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {show.description}
              </p>
            </div>

            {/* Event Schedule & Location */}
            <div className="bg-[#FDF4AF]/40 rounded-xl p-5 border border-yellow-200 space-y-3">
              <h2 className="text-lg font-bold text-gray-800">Date & Venue</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900">📅 Date & Time</p>
                  <p>
                    {new Date(show.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-gray-500">
                    {show.startTime} – {show.endTime}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900">📍 Venue</p>
                  <p className="font-medium">{show.venue?.name}</p>
                  <p className="text-gray-500">{show.venue?.address}</p>
                  <p className="text-gray-500">{show.venue?.city}</p>
                </div>
              </div>
            </div>

            {/* Featured Artists */}
            {show.artists?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Featured Artists
                </h2>
                <div className="flex flex-wrap gap-6">
                  {show.artists.map((artist, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      {artist.image ? (
                        <img
                          src={
                            artist.image.startsWith("http")
                              ? artist.image
                              : `${API}/${artist.image}`
                          }
                          alt={artist.name}
                          className="w-20 h-20 rounded-full object-cover border-2 border-[#34908B] shadow"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#34908B] text-white flex items-center justify-center text-xl font-bold border-2 border-[#34908B] shadow">
                          {artist.name ? artist.name.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                      <p className="mt-2 text-sm font-medium text-gray-800">
                        {artist.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {show.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {show.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full border"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Booking Sidebar (Right Column) */}
          <div className="bg-[#A5E9DD]/30 border border-[#8ce0d2] rounded-xl p-6 h-fit space-y-6">
            <div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Ticket Price
              </span>
              <p className="text-3xl font-extrabold text-[#34908B] mt-1">
                {show.price ? `Rs. ${show.price}` : "Free"}
              </p>
            </div>

            <div className="space-y-2 text-sm text-gray-700 border-t border-b border-[#8ce0d2] py-4">
              <div className="flex justify-between">
                <span>Available Tickets:</span>
                <span className="font-semibold text-gray-900">
                  {show.availableTickets}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Max per User:</span>
                <span className="font-semibold text-gray-900">
                  {show.maxTicketsPerUser}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            {show.availableTickets > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Quantity
                  </label>
                  <select
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#34908B]"
                  >
                    {Array.from({ length: maxSelectable }, (_, i) => i + 1).map(
                      (num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Ticket" : "Tickets"}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="flex justify-between items-center font-bold text-gray-800">
                  <span>Total Amount:</span>
                  <span className="text-xl text-[#34908B]">
                    Rs. {(show.price || 0) * ticketQuantity}
                  </span>
                </div>

                <button
                  onClick={handleBooking}
                  className="w-full bg-[#34908B] text-white font-semibold py-3 rounded-lg hover:bg-[#2b7873] transition shadow-md"
                >
                  Book Tickets
                </button>
              </div>
            ) : (
              <div className="bg-red-100 text-red-700 font-semibold text-center p-3 rounded-lg border border-red-200">
                Sold Out
              </div>
            )}

            {/* Refund Policy Note */}
            {show.refundPolicy && (
              <div className="text-xs text-gray-500 bg-white p-3 rounded-lg border">
                <p className="font-semibold text-gray-700 mb-0.5">
                  Refund Policy:
                </p>
                <p>{show.refundPolicy}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}