import React, { useEffect, useState, useMemo } from "react";

export default function OrganizerBookings() {
  const API = import.meta.env.VITE_API;

  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalTicketsSold: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShowModal, setSelectedShowModal] = useState(null);

  useEffect(() => {
    fetchOrganizerBookings();
  }, []);

  const fetchOrganizerBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/bookings/organizer/bookings`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch organizer bookings.");
      }

      setBookings(data.bookings || []);
      setSummary(data.summary || { totalRevenue: 0, totalTicketsSold: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process data for grouping per Show
  const aggregatedShows = useMemo(() => {
    const map = {};

    bookings.forEach((booking) => {
      const show = booking.showId;
      if (!show || !show._id) return;

      const showId = show._id;

      if (!map[showId]) {
        map[showId] = {
          showDetails: show,
          totalBookingsCount: 0,
          ticketsSoldFromPaidBookings: 0,
          totalEarnedAmount: 0,
          bookingsList: [],
        };
      }

      map[showId].bookingsList.push(booking);
      map[showId].totalBookingsCount += 1;

      if (booking.paymentStatus === "paid") {
        map[showId].ticketsSoldFromPaidBookings += booking.totalTickets || 0;
        map[showId].totalEarnedAmount += booking.totalAmount || 0;
      }
    });

    return Object.values(map);
  }, [bookings]);

  // Filtered orders inside Modal
  const modalBookingsFiltered = useMemo(() => {
    if (!selectedShowModal) return [];
    return selectedShowModal.bookingsList.filter((b) => {
      const name = b.userId?.name?.toLowerCase() || "";
      const email = b.userId?.email?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [selectedShowModal, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] flex items-center justify-center p-6">
        <div className="text-xl font-bold text-[#34908B] flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-sm border border-[#8ce0d2]">
          <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#34908B]"></span>
          Fetching Live Dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] p-6 flex items-center justify-center">
        <div className="bg-white text-red-600 border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Failed to Load Dashboard</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchOrganizerBookings}
            className="bg-[#34908B] text-white px-5 py-2.5 rounded-xl hover:bg-[#2b7873] transition font-medium shadow-md"
          >
            Retry Fetching
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF4AF] py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#34908B]">
              Organizer Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time revenue analytics and event management.
            </p>
          </div>
          <button
            onClick={fetchOrganizerBookings}
            className="self-start sm:self-auto bg-white border border-[#8ce0d2] text-[#34908B] px-4 py-2 rounded-xl font-semibold text-xs hover:bg-[#34908B] hover:text-white transition shadow-sm"
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#8ce0d2] shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="text-2xl font-extrabold text-[#34908B] mt-1">
              Rs. {summary.totalRevenue.toLocaleString()}
            </div>
            <span className="text-xs text-green-600 font-medium">
              Verified paid bookings
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#8ce0d2] shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Tickets Sold
            </span>
            <div className="text-2xl font-extrabold text-gray-800 mt-1">
              {summary.totalTicketsSold}
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Total quantity issued
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#8ce0d2] shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Active Events
            </span>
            <div className="text-2xl font-extrabold text-gray-800 mt-1">
              {aggregatedShows.length}
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Events with active orders
            </span>
          </div>
        </div>

        {/* Show Analytics Cards */}
        {aggregatedShows.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-md border border-[#8ce0d2]">
            <div className="text-5xl mb-3">🎫</div>
            <h3 className="text-xl font-bold text-gray-800">No Bookings Yet</h3>
            <p className="text-gray-500 text-sm mt-1">
              Once users start purchasing tickets, your sales will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#34908B]">
              Show Performance
            </h2>

            <div className="grid grid-cols-1 gap-6">
              {aggregatedShows.map((item) => {
                const show = item.showDetails;
                const totalTickets = show.totalTickets || 0;
                const soldTickets = show.soldTickets ?? item.ticketsSoldFromPaidBookings;
                const availableTickets = show.availableTickets ?? Math.max(0, totalTickets - soldTickets);
                
                const salesPercent =
                  totalTickets > 0
                    ? Math.min(100, Math.round((soldTickets / totalTickets) * 100))
                    : 0;

                const bannerSrc = show.bannerImage
                  ? show.bannerImage.startsWith("http")
                    ? show.bannerImage
                    : `${API}/${show.bannerImage.replace(/^\/+/, "")}`
                  : null;

                return (
                  <div
                    key={show._id}
                    className="bg-white rounded-2xl border border-[#8ce0d2] shadow-md overflow-hidden transition hover:shadow-lg grid grid-cols-1 md:grid-cols-12"
                  >
                    {/* Event Banner */}
                    <div className="md:col-span-4 relative bg-gray-100 min-h-[190px]">
                      {bannerSrc ? (
                        <img
                          src={bannerSrc}
                          alt={show.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold text-sm">
                          No Banner Provided
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-[#34908B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        Rs. {show.price || 0} / Ticket
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="md:col-span-8 p-6 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="text-xl font-extrabold text-[#34908B]">
                              {show.name || "Untitled Show"}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              📅 {formatDate(show.date)} • 📍{" "}
                              {show.venue?.name || "Venue TBD"}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-gray-400 font-bold uppercase block">
                              Revenue
                            </span>
                            <span className="text-xl font-extrabold text-[#34908B]">
                              Rs. {item.totalEarnedAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-gray-600">
                              Capacity Filled ({salesPercent}%)
                            </span>
                            <span className="text-[#34908B]">
                              {soldTickets} / {totalTickets} Sold
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
                            <div
                              className="bg-[#34908B] h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${salesPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Breakdown Pills */}
                        <div className="grid grid-cols-3 gap-2 mt-4 bg-[#FDF4AF]/40 p-3 rounded-xl border border-yellow-200 text-center">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              Total
                            </span>
                            <p className="text-base font-bold text-gray-800">
                              {totalTickets}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              Sold
                            </span>
                            <p className="text-base font-bold text-green-700">
                              {soldTickets}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              Left
                            </span>
                            <p className="text-base font-bold text-amber-700">
                              {availableTickets}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-xs text-gray-500">
                          {item.totalBookingsCount} order entries
                        </span>
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedShowModal(item);
                          }}
                          className="bg-[#34908B] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#2b7873] transition shadow-sm"
                        >
                          View Customer Orders →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* --- ORDER DETAILS MODAL --- */}
      {selectedShowModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-[#8ce0d2] my-8 flex flex-col">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#34908B] text-white p-5 flex justify-between items-center z-10 shadow-sm">
              <div>
                <h3 className="text-lg font-bold">
                  {selectedShowModal.showDetails.name}
                </h3>
                <p className="text-xs text-[#A5E9DD]">
                  Order Records ({selectedShowModal.bookingsList.length} Total)
                </p>
              </div>
              <button
                onClick={() => setSelectedShowModal(null)}
                className="text-white hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 flex-1">
              {/* Search input inside modal */}
              <input
                type="text"
                placeholder="Search buyer name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-[#34908B]"
              />

              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b">
                    <tr>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Tickets</th>
                      <th className="p-3">Total Paid</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {modalBookingsFiltered.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400 text-xs">
                          No matching orders found.
                        </td>
                      </tr>
                    ) : (
                      modalBookingsFiltered.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50/50">
                          <td className="p-3">
                            <p className="font-bold text-gray-800">
                              {booking.userId?.name || "N/A"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {booking.userId?.email || "N/A"}
                            </p>
                          </td>
                          <td className="p-3 font-semibold text-gray-700">
                            {booking.totalTickets} ticket(s)
                          </td>
                          <td className="p-3 font-bold text-[#34908B]">
                            Rs. {booking.totalAmount}
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                booking.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {booking.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-gray-400">
                            {formatDate(booking.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedShowModal(null)}
                className="px-5 py-2 bg-[#34908B] hover:bg-[#2b7873] text-white text-sm font-semibold rounded-xl transition"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}