import React, { useState, useEffect, useRef, useContext } from "react";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  User,
  Ticket,
  Calendar,
  Camera,
  Film,
  Search,
  ChevronDown,
  X,
  Upload
} from "lucide-react";
import { AuthContext } from "../../store/AuthContext";

const TicketScanner = () => {
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [fetchingShows, setFetchingShows] = useState(true);

  // Searchable Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Scanner & Upload state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanned, setLastScanned] = useState(null);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isProcessingRef = useRef(false);
  const { API } = useContext(AuthContext);

  // Synchronous ref for selectedShow so scanner callbacks always see the current show ID
  const selectedShowIdRef = useRef(selectedShow?._id || "");
  useEffect(() => {
    selectedShowIdRef.current = selectedShow?._id || "";
  }, [selectedShow]);

  // Safe time formatting helper
  const formatShowTime = (timeStr) => {
    if (!timeStr) return "";
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch available shows on component mount
  useEffect(() => {
    const fetchShows = async () => {
      try {
        setFetchingShows(true);
        const response = await fetch(`${API}/api/shows`, {
          credentials: "include",
        });
        const data = await response.json();

        if (response.ok) {
          const loadedShows = data.shows || data.data || (Array.isArray(data) ? data : []);
          setShows(loadedShows);
        } else {
          console.error("Failed to load shows:", data.message);
        }
      } catch (err) {
        console.error("Error fetching shows:", err);
      } finally {
        setFetchingShows(false);
      }
    };

    fetchShows();
  }, [API]);

  // Filter shows based on search query
  const filteredShows = shows.filter((show) => {
    const query = searchTerm.toLowerCase();
    const showName = (show.name || show.title || "").toLowerCase();
    const showGenre = (show.genre || "").toLowerCase();
    const venueName = (show.venue?.name || "").toLowerCase();

    return showName.includes(query) || showGenre.includes(query) || venueName.includes(query);
  });

  // Audio feedback cues
  const playSound = (type) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(800, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        osc.start();
        osc.stop(audioContext.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(300, audioContext.currentTime);
        osc.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
        gain.gain.setValueAtTime(0.4, audioContext.currentTime);
        osc.start();
        osc.stop(audioContext.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("Audio playback not supported or blocked by browser", e);
    }
  };

  // Shared verification logic
  const verifyTicket = async (decodedText) => {
    if (isProcessingRef.current || decodedText === lastScanned) return;

    // Check if a show is selected
    if (!selectedShowIdRef.current) {
      playSound("error");
      setError({ message: "Please select a show from the dropdown before scanning!" });
      return;
    }

    isProcessingRef.current = true;
    setLastScanned(decodedText);
    setLoading(true);
    setError(null);
    setScanResult(null);

    // Pause camera if active
    if (isCameraActive && scannerRef.current) {
      try {
        scannerRef.current.pause(true);
      } catch (e) {
        console.warn("Could not pause scanner:", e);
      }
    }

    try {
      const response = await fetch(`${API}/api/tickets/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          qrData: decodedText,
          showId: selectedShowIdRef.current,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data?.message || "Verification failed",
          checkedInAt: data?.checkedInAt,
        };
      }

      playSound("success");
      setScanResult({
        status: "success",
        message: data.message || "Entry Allowed",
        ticket: data.ticket,
      });
    } catch (err) {
      playSound("error");
      setError({
        message: err.message || "Network or verification error",
        checkedInAt: err.checkedInAt,
        status: err.status,
      });
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  // --- Camera QR Scanner Setup ---
  useEffect(() => {
    if (isCameraActive) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          // on success – pause and verify
          if (scannerRef.current) {
            scannerRef.current.pause(true).catch(() => {});
          }
          verifyTicket(decodedText);
        },
        () => {} // ignore failure
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err) => console.error("Failed to clear scanner", err));
        scannerRef.current = null;
      }
    };
  }, [isCameraActive]);

  // --- Image Upload QR Decoding ---
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setScanResult(null);

    const html5QrCode = new Html5Qrcode("hidden-qr-reader");

    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      await verifyTicket(decodedText);
    } catch (err) {
      html5QrCode.clear();
      setError({
        message: "Could not read a valid QR code from the uploaded image.",
      });
      setLoading(false);
    } finally {
      // Reset file input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Reset state after a scan / error
  const handleReset = () => {
    setScanResult(null);
    setError(null);
    setLastScanned(null);
    isProcessingRef.current = false;

    // Resume camera if active
    if (isCameraActive && scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch (e) {
        console.warn("Could not resume scanner:", e);
      }
    }
  };

  // Cancel camera mode
  const handleCloseCamera = () => {
    setIsCameraActive(false);
    setError(null);
    setScanResult(null);
    setLoading(false);
    // If scanner was paused, we clear it in the cleanup effect
  };

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-slate-900 text-white flex flex-col">
      <div id="hidden-qr-reader" className="hidden"></div>

      <header className="py-4 text-center border-b border-slate-800 space-y-3">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <Camera className="w-6 h-6 text-indigo-400" /> Ticket Verification
        </h1>

        {/* Custom Searchable Dropdown */}
        <div className="relative text-left" ref={dropdownRef}>
          <button
            type="button"
            disabled={loading || fetchingShows || !!scanResult || !!error}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full bg-slate-800 p-3 rounded-xl border flex items-center justify-between text-sm transition ${
              !selectedShow ? "border-amber-500/50 text-amber-300" : "border-slate-700 text-slate-100"
            } disabled:opacity-50`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Film className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="truncate font-medium">
                {fetchingShows
                  ? "Loading active shows..."
                  : selectedShow
                  ? `${selectedShow.name || selectedShow.title} (${formatShowTime(selectedShow.startTime)})`
                  : "-- Select a Show --"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Search Popover Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-700 flex items-center gap-2 bg-slate-850">
                <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search show, venue, or genre..."
                  className="bg-transparent text-sm w-full text-slate-100 focus:outline-none py-1 placeholder:text-slate-500"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <ul className="max-h-56 overflow-y-auto divide-y divide-slate-700/50">
                {filteredShows.length === 0 ? (
                  <li className="p-3 text-xs text-center text-slate-400">
                    No matching shows found
                  </li>
                ) : (
                  filteredShows.map((show) => {
                    const isSelected = selectedShow?._id === show._id;
                    const showTitle = show.name || show.title || "Untitled Show";
                    const formattedTime = formatShowTime(show.startTime);

                    return (
                      <li
                        key={show._id}
                        onClick={() => {
                          setSelectedShow(show);
                          setIsDropdownOpen(false);
                          setSearchTerm("");
                          setError(null);
                        }}
                        className={`p-3 text-sm cursor-pointer transition flex items-center justify-between hover:bg-slate-700/60 ${
                          isSelected
                            ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                            : "text-slate-200"
                        }`}
                      >
                        <div className="truncate">
                          <p className="truncate">{showTitle}</p>
                          {show.venue?.name && (
                            <p className="text-xs text-slate-400 truncate">
                              {show.venue.name}
                            </p>
                          )}
                        </div>
                        {formattedTime && (
                          <span className="text-xs text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40 shrink-0 ml-2">
                            {formattedTime}
                          </span>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>
      </header>

      <main className="my-auto py-6 space-y-5">
        {/* Mode selection buttons (only when no result/error and camera not active) */}
        {!isCameraActive && !scanResult && !error && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsCameraActive(true)}
              disabled={loading || !selectedShow}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
            >
              <Camera className="w-4 h-4 text-indigo-400" />
              Scan Camera
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || !selectedShow}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
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

        {/* Camera Scanner */}
        {isCameraActive && (
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 relative shadow-2xl">
            <button
              onClick={handleCloseCamera}
              className="absolute top-3 right-3 z-10 bg-slate-700 hover:bg-slate-600 text-white p-1.5 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs text-center text-slate-300 mb-3 font-medium">
              Point camera at ticket QR code
            </p>
            <div id="reader" className="overflow-hidden rounded-lg"></div>
            {loading && (
              <div className="mt-4 text-center text-indigo-400 flex items-center justify-center gap-2 font-medium">
                <RefreshCw className="w-5 h-5 animate-spin" /> Verifying payload...
              </div>
            )}
          </div>
        )}

        {/* Loading overlay when uploading without camera */}
        {!isCameraActive && loading && (
          <div className="bg-slate-800/80 p-6 rounded-2xl text-center border border-slate-700">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300">Processing image...</p>
          </div>
        )}

        {/* Success Modal */}
        {scanResult && (
          <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-2xl font-black text-emerald-300 tracking-wide uppercase">
              {scanResult.message}
            </h2>

            <div className="mt-6 bg-slate-900/60 rounded-xl p-4 text-left space-y-3 text-sm border border-emerald-500/30">
              <div className="flex items-center gap-2 text-slate-300">
                <Ticket className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">Ticket ID:</span>
                <span className="font-mono text-emerald-200">
                  {scanResult.ticket?.ticketId || "N/A"}
                </span>
              </div>

              {scanResult.ticket?.seatNumber && (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="font-semibold">Seat:</span>
                  <span className="text-slate-100">{scanResult.ticket.seatNumber}</span>
                </div>
              )}

              {scanResult.ticket?.userName && (
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold">Attendee:</span>
                  <span className="text-slate-100">{scanResult.ticket.userName}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/30"
            >
              Scan Next Ticket
            </button>
          </div>
        )}

        {/* Error Modal */}
        {error && (
          <div className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <XCircle className="w-20 h-20 text-rose-500 mx-auto" />
            <h2 className="text-xl font-bold text-rose-300">Verification Failed</h2>
            <p className="text-sm text-rose-200/90">{error.message}</p>

            {error.checkedInAt && (
              <div className="bg-slate-900/60 p-3 rounded-xl border border-rose-500/30 text-xs text-slate-300 space-y-1">
                <div className="flex items-center justify-center gap-1 text-amber-400 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> Already Checked In
                </div>
                <p>Checked in at: {new Date(error.checkedInAt).toLocaleString()}</p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-lg shadow-rose-600/30"
            >
              Try Again
            </button>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-500 py-2">
        Door Manager Scanner • Ticket Verification Portal
      </footer>
    </div>
  );
};

export default TicketScanner;