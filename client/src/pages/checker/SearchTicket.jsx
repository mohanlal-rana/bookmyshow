import React, { useState, useContext, useRef, useEffect } from "react";
import { 
  Search, 
  Ticket, 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  Film,
  Camera,
  Upload,
  X,
  Target
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import { AuthContext } from "../../store/AuthContext";

export default function SearchTicket() {
  const [searchInput, setSearchInput] = useState("");
  const [booking, setBooking] = useState(null);
  const [scannedTicketId, setScannedTicketId] = useState(""); // Track the specific ticket searched/scanned
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Camera & Image Upload state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const { API } = useContext(AuthContext);

  // Extract clean query string or JSON payload from QR scan
  const extractSearchQuery = (rawPayload) => {
    if (!rawPayload) return "";
    const trimmed = rawPayload.trim();

    // Handle JSON payload from scanned QR codes
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.ticketId || parsed.bookingId || parsed.id || parsed._id || trimmed;
      } catch (e) {
        console.warn("Failed to parse JSON QR payload", e);
      }
    }

    // Handle URL string format
    if (trimmed.includes("/")) {
      const parts = trimmed.split("/").filter(Boolean);
      return parts[parts.length - 1];
    }

    return trimmed;
  };

  // Fetch Booking Details via GET /api/tickets/search
  const fetchBooking = async (rawInput) => {
    const cleanQuery = extractSearchQuery(rawInput);

    if (!cleanQuery) {
      setError("Invalid search query or QR payload.");
      return;
    }

    setLoading(true);
    setError(null);
    setBooking(null);
    setScannedTicketId(cleanQuery); // Save the scanned/searched ID to highlight target ticket

    try {
      const response = await fetch(`${API}/api/tickets/search?query=${encodeURIComponent(cleanQuery)}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking or ticket not found");
      }

      setBooking(data.data);
      setSearchInput(cleanQuery);
    } catch (err) {
      setError(err.message || "An unexpected error occurred while looking up ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooking(searchInput);
  };

  // Camera QR Scanner Setup
  useEffect(() => {
    if (isCameraActive) {
      const scanner = new Html5QrcodeScanner(
        "search-reader",
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear().catch((err) => console.error(err));
          setIsCameraActive(false);
          fetchBooking(decodedText);
        },
        () => {}
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error(err));
      }
    };
  }, [isCameraActive]);

  // Handle Image File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const html5QrCode = new Html5Qrcode("hidden-qr-reader");

    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      fetchBooking(decodedText);
    } catch (err) {
      html5QrCode.clear();
      setError("Could not read a valid QR code from the uploaded image.");
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchInput("");
    setBooking(null);
    setScannedTicketId("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatShowTime = (timeStr) => {
    if (!timeStr) return "N/A";
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const parsedDate = new Date(timeStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return timeStr;
  };

  // Helper to determine if a specific ticket is the scanned target
  const isScannedTicket = (ticket) => {
    return ticket.ticketId === scannedTicketId;
  };

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-slate-900 text-white flex flex-col">
      <div id="hidden-qr-reader" className="hidden"></div>

      <header className="py-4 text-center border-b border-slate-800 space-y-1">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <Search className="w-6 h-6 text-indigo-400" /> Ticket Lookup Portal
        </h1>
        <p className="text-xs text-slate-400">
          Scan camera, upload QR image, or search Booking / Ticket ID
        </p>
      </header>

      <main className="my-auto py-6 space-y-5">
        {!isCameraActive && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsCameraActive(true)}
              disabled={loading}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition"
            >
              <Camera className="w-4 h-4 text-indigo-400" />
              Scan Camera
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              Upload Image
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {isCameraActive && (
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 relative shadow-2xl">
            <button
              onClick={() => setIsCameraActive(false)}
              className="absolute top-3 right-3 z-10 bg-slate-700 hover:bg-slate-600 text-white p-1.5 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs text-center text-slate-300 mb-3 font-medium">
              Point camera at ticket QR code
            </p>
            <div id="search-reader" className="overflow-hidden rounded-lg"></div>
          </div>
        )}

        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="relative">
            <Ticket className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Booking ID or Ticket ID..."
              disabled={loading}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!searchInput.trim() || loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-600/20"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Lookup Ticket
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="bg-rose-950/80 border border-rose-500/50 rounded-2xl p-4 text-center space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-rose-300">Lookup Failed</h3>
            <p className="text-xs text-rose-200/80">{error}</p>
          </div>
        )}

        {booking && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Payment & Booking Status Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Payment Status
              </span>
              {booking.paymentStatus === "paid" ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Paid & Valid
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {booking.paymentStatus || "Pending"}
                </span>
              )}
            </div>

            {/* Event Details */}
            <div className="space-y-2.5 text-sm">
              <h4 className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                Event Details
              </h4>
              <div className="bg-slate-900/60 p-3 rounded-xl space-y-2 border border-slate-700/50">
                <div className="flex items-center gap-2 font-medium text-slate-100">
                  <Film className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">{booking.showId?.title || booking.showId?.name || "N/A"}</span>
                </div>
                {booking.showId?.venue && (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="truncate">
                      {typeof booking.showId.venue === "object"
                        ? booking.showId.venue.name || booking.showId.venue.address
                        : booking.showId.venue}
                    </span>
                  </div>
                )}
                {booking.showId?.date && (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{new Date(booking.showId.date).toLocaleDateString()}</span>
                  </div>
                )}
                {booking.showId?.startTime && (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{formatShowTime(booking.showId.startTime)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attendee Info */}
            <div className="space-y-2.5 text-sm">
              <h4 className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                Attendee Details
              </h4>
              <div className="bg-slate-900/60 p-3 rounded-xl space-y-2 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-200">
                  <User className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold">{booking.userId?.name || "Guest User"}</span>
                </div>
                {booking.userId?.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{booking.userId.email}</span>
                  </div>
                )}
                {booking.userId?.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{booking.userId.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Individual Tickets & Check-In Breakdown */}
            <div className="space-y-2.5 text-sm">
              <h4 className="text-xs text-indigo-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Tickets Check-In Status</span>
                <span className="text-slate-400 text-[11px] font-normal">Total: {booking.totalTickets}</span>
              </h4>

              <div className="space-y-2">
                {booking.tickets && booking.tickets.length > 0 ? (
                  booking.tickets.map((t, index) => {
                    const isTarget = isScannedTicket(t);
                    return (
                      <div
                        key={t.ticketId || index}
                        className={`p-3 rounded-xl border transition ${
                          isTarget
                            ? "bg-indigo-950/60 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30"
                            : "bg-slate-900/60 border-slate-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-100 text-xs">
                                Seat: {t.seatNumber || t.ticketType || `Ticket #${index + 1}`}
                              </span>
                              {isTarget && (
                                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-400/40">
                                  <Target className="w-3 h-3" /> Scanned Target
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">
                              ID: {t.ticketId}
                            </p>
                          </div>

                          {/* Check-in Badge */}
                          {t.isCheckedIn ? (
                            <div className="text-right">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                              </span>
                              {t.checkedInAt && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {new Date(t.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Not Checked In
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                    No tickets array found on this booking record.
                  </p>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-slate-900/60 p-3 rounded-xl space-y-2 text-xs border border-slate-700/50">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Booking ID:</span>
                <span className="font-mono text-slate-200 font-semibold">{booking._id}</span>
              </div>
              {booking.totalAmount !== undefined && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-slate-200 text-sm">
                  <span className="font-semibold text-slate-400">Total Paid:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    Rs. {booking.totalAmount}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-500 py-2">
        Checker Portal • Ticket Verification System
      </footer>
    </div>
  );
}