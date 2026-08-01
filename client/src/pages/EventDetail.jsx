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
  const [selectedTicketType, setSelectedTicketType] = useState("");

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
        
        // Auto-select first ticket type if available
        if (data.show?.ticketTypes?.length > 0) {
          setSelectedTicketType(data.show.ticketTypes[0].name);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShowDetail();
  }, [API, id]);

  const handleBooking = () => {
    // Navigate to payment page with required state
    navigate(`/booking/payment/${id}`, {
      state: { 
        show, 
        quantity: ticketQuantity,
        ticketType: selectedTicketType || show?.ticketTypes?.[0]?.name || "Standard" 
      },
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

  const selectedTypeInfo = show.ticketTypes?.find((t) => t.name === selectedTicketType) || show.ticketTypes?.[0];
  const unitPrice = selectedTypeInfo?.price || show.price || 0;
  const availableQty = selectedTypeInfo?.quantity ?? show.availableTickets ?? 0;

  const maxSelectable = Math.min(
    show.maxTicketsPerUser || 5,
    availableQty
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

            {/* Date & Venue */}
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
          </div>

          {/* Ticket Booking Sidebar (Right Column) */}
          <div className="bg-[#A5E9DD]/30 border border-[#8ce0d2] rounded-xl p-6 h-fit space-y-6">
            
            {/* Ticket Type Selector (If show has multiple ticket types) */}
            {show.ticketTypes?.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Ticket Type
                </label>
                <div className="space-y-2">
                  {show.ticketTypes.map((type) => (
                    <button
                      key={type.name}
                      onClick={() => setSelectedTicketType(type.name)}
                      className={`w-full text-left p-3 rounded-lg border text-sm transition ${
                        selectedTicketType === type.name
                          ? "border-[#34908B] bg-[#34908B]/10 font-bold text-[#34908B]"
                          : "border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span>{type.name}</span>
                        <span>Rs. {type.price}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-normal">
                        {type.quantity} tickets left
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Ticket Price
              </span>
              <p className="text-3xl font-extrabold text-[#34908B] mt-1">
                {unitPrice ? `Rs. ${unitPrice}` : "Free"}
              </p>
            </div>

            {/* Quantity Selector */}
            {availableQty > 0 ? (
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
                    Rs. {unitPrice * ticketQuantity}
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
          </div>

        </div>
      </div>
    </div>
  );
}