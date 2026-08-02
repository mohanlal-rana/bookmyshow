import React, { useState, useEffect, useRef, useContext } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
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
  X
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

  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanned, setLastScanned] = useState(null);
  
  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const { API } = useContext(AuthContext);

  // Synchronous ref for selectedShow so scanner callbacks always see the current show ID
  const selectedShowIdRef = useRef(selectedShow?._id || "");
  useEffect(() => {
    selectedShowIdRef.current = selectedShow?._id || "";
  }, [selectedShow]);

  // Helper function to safely format startTime whether it's "13:00" or an ISO string
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

  // 1. Fetch available shows on component mount (Without Auto-Selecting)
  useEffect(() => {
    const fetchShows = async () => {
      try {
        setFetchingShows(true);
        const response = await fetch(`${API}/api/shows`, { 
          credentials: "include" 
        });
        const data = await response.json();

        if (response.ok) {
          const loadedShows = data.shows || data.data || (Array.isArray(data) ? data : []);
          setShows(loadedShows);
          // Auto-selection removed: Door staff must manually select the show
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

  // 2. Initialize HTML5 QR Code Scanner
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error("Failed to clear scanner", err));
      }
    };
  }, []);

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

  const onScanSuccess = async (decodedText) => {
    if (isProcessingRef.current || decodedText === lastScanned) return;

    // Check if a show is selected before sending POST request
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

    try {
      if (scannerRef.current) {
        scannerRef.current.pause(true);
      }
    } catch (e) {
      console.warn("Could not pause scanner:", e);
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
          showId: selectedShowIdRef.current 
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
    }
  };

  const onScanFailure = () => {
    // Ignore frame decoding failures during continuous camera feed
  };

  const handleReset = () => {
    setScanResult(null);
    setError(null);

    try {
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    } catch (e) {
      console.warn("Could not resume scanner:", e);
    }

    setTimeout(() => {
      setLastScanned(null);
      isProcessingRef.current = false;
    }, 500);
  };

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Header */}
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
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Search Popover Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Search Bar Input */}
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
                  <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-white p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Show List Options */}
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
                          isSelected ? "bg-indigo-600/20 text-indigo-300 font-semibold" : "text-slate-200"
                        }`}
                      >
                        <div className="truncate">
                          <p className="truncate">{showTitle}</p>
                          {show.venue?.name && (
                            <p className="text-xs text-slate-400 truncate">{show.venue.name}</p>
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

      {/* Main Content Area */}
      <main className="my-auto py-6">
        {/* Scanner Container */}
        <div className={`bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 ${scanResult || error ? 'hidden' : 'block'}`}>
          <div id="reader" className="overflow-hidden rounded-lg"></div>
          {loading && (
            <div className="mt-4 text-center text-indigo-400 flex items-center justify-center gap-2 font-medium">
              <RefreshCw className="w-5 h-5 animate-spin" /> Verifying payload...
            </div>
          )}
        </div>

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
                <span className="font-semibold">Ticket ID:</span> {scanResult.ticket?.ticketId}
              </div>
              {scanResult.ticket?.seatNumber && (
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">Seat:</span> {scanResult.ticket.seatNumber}
                </div>
              )}
              {scanResult.ticket?.ticketType && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">Tier:</span>{" "}
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">
                    {scanResult.ticket.ticketType}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="mt-6 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition duration-150 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Scan Next Ticket
            </button>
          </div>
        )}

        {/* Error Modal */}
        {error && (
          <div className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            {error.message === "Ticket already used" ? (
              <AlertTriangle className="w-20 h-20 text-amber-400 mx-auto mb-3" />
            ) : (
              <XCircle className="w-20 h-20 text-rose-500 mx-auto mb-3" />
            )}

            <h2 className="text-2xl font-black text-rose-300 tracking-wide uppercase">
              {error.message}
            </h2>

            {error.checkedInAt && (
              <p className="mt-2 text-xs text-rose-200">
                Scanned on: {new Date(error.checkedInAt).toLocaleString()}
              </p>
            )}

            <button
              onClick={handleReset}
              className="mt-6 w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition duration-150 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Try Again
            </button>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-500 py-2">
        Ready to scan • Position QR inside the frame
      </footer>
    </div>
  );
};

export default TicketScanner;