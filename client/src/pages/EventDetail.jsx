import { useEffect, useState, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../store/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper component for drawing route lines on the Leaflet map
import RoutingControl from "./RoutingControl";

// Fix standard Leaflet marker icon path bug in React
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default function EventDetail() {
  const { API } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedTicketType, setSelectedTicketType] = useState("standard");

  // Directions state
  const [userCoords, setUserCoords] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

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

  // Compute Standard vs Student pricing options
  const ticketOptions = useMemo(() => {
    const basePrice = show?.price || 0;
    const standardPrice = show?.prices?.standard ?? basePrice;
    const studentPrice = show?.prices?.student ?? Math.round(basePrice * 0.8);

    return [
      { name: "Standard Ticket", typeKey: "standard", price: standardPrice },
      { name: "Student Ticket (20% Off)", typeKey: "student", price: studentPrice },
    ];
  }, [show]);

  const selectedTier = useMemo(() => {
    return (
      ticketOptions.find((t) => t.typeKey === selectedTicketType) ||
      ticketOptions[0]
    );
  }, [ticketOptions, selectedTicketType]);

  const unitPrice = selectedTier?.price || 0;
  const availableQty = show?.availableTickets || 0;
  const maxSelectable = Math.min(show?.maxTicketsPerUser || 5, availableQty);

  const handleBooking = () => {
    navigate(`/booking/payment/${id}`, {
      state: {
        show,
        quantity: ticketQuantity,
        ticketType: selectedTier.typeKey, // Sends "standard" or "student"
        totalAmount: unitPrice * ticketQuantity,
      },
    });
  };

  // Coordinates extraction [lng, lat] from GeoJSON
  const coordinates = show?.venue?.location?.coordinates;
  const hasCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    !isNaN(coordinates[0]) &&
    !isNaN(coordinates[1]);

  const mapPosition = hasCoordinates ? [coordinates[1], coordinates[0]] : null;

  const handleGetDirections = () => {
    setLocationError("");
    setGettingLocation(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords([position.coords.latitude, position.coords.longitude]);
          setGettingLocation(false);
        },
        () => {
          setGettingLocation(false);
          setLocationError("Unable to retrieve your location. Please check browser permissions.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGettingLocation(false);
      setLocationError("Geolocation is not supported by your browser.");
    }
  };

  const openNativeNavigation = () => {
    if (!mapPosition) return;
    const [lat, lng] = mapPosition;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const navUrl = isIOS
      ? `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

    window.open(navUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] flex items-center justify-center p-6">
        <div className="text-xl font-semibold text-[#34908B]">Loading event details...</div>
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
          {/* Main Content */}
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

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">About the Event</h2>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {show.description}
              </p>
            </div>

            {/* Date & Venue Section */}
            <div className="bg-[#FDF4AF]/40 rounded-xl p-5 border border-yellow-200 space-y-4">
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

              {/* Leaflet Map & Directions */}
              {mapPosition ? (
                <div className="space-y-3 mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={handleGetDirections}
                      disabled={gettingLocation}
                      className="bg-[#34908B] text-white text-xs px-3 py-2 rounded-lg hover:bg-[#2b7873] transition font-semibold disabled:opacity-50 shadow-sm"
                    >
                      {gettingLocation
                        ? "Locating..."
                        : userCoords
                        ? "🔄 Recalculate Route"
                        : "🚗 Show Route on Map"}
                    </button>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapPosition[0]},${mapPosition[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-xs px-3 py-2 rounded-lg hover:bg-gray-50 transition font-semibold shadow-sm"
                    >
                      Open in Google Maps
                    </a>
                    <button
                      onClick={openNativeNavigation}
                      className="border border-[#34908B] text-[#34908B] text-xs px-3 py-2 rounded-lg hover:bg-[#34908B]/10 transition font-semibold"
                    >
                      ↗ Turn-by-Turn Navigation
                    </button>
                  </div>

                  {locationError && (
                    <p className="text-xs text-red-500">{locationError}</p>
                  )}

                  <div className="w-full h-72 rounded-xl overflow-hidden border border-gray-300 z-0">
                    <MapContainer
                      center={mapPosition}
                      zoom={14}
                      scrollWheelZoom={false}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <Marker position={mapPosition}>
                        <Popup>
                          <strong>{show.venue?.name}</strong> <br />
                          {show.venue?.address}, {show.venue?.city}
                        </Popup>
                      </Marker>

                      {userCoords && (
                        <Marker position={userCoords}>
                          <Popup>Your Location</Popup>
                        </Marker>
                      )}

                      {userCoords && (
                        <RoutingControl
                          userCoords={userCoords}
                          venueCoords={mapPosition}
                        />
                      )}
                    </MapContainer>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-500 text-xs text-center py-4 rounded-lg border border-dashed border-gray-300 mt-2">
                  Map coordinates unavailable for this venue
                </div>
              )}
            </div>
          </div>

          {/* Ticket Booking Sidebar */}
          <div className="bg-[#A5E9DD]/30 border border-[#8ce0d2] rounded-xl p-6 h-fit space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Ticket Category
              </label>
              <div className="space-y-2">
                {ticketOptions.map((tier) => (
                  <button
                    key={tier.typeKey}
                    onClick={() => {
                      setSelectedTicketType(tier.typeKey);
                      setTicketQuantity(1);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition ${
                      selectedTicketType === tier.typeKey
                        ? "border-[#34908B] bg-[#34908B]/10 font-bold text-[#34908B]"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{tier.name}</span>
                      <span>Rs. {tier.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Ticket Unit Price
              </span>
              <p className="text-3xl font-extrabold text-[#34908B] mt-1">
                {unitPrice ? `Rs. ${unitPrice}` : "Free"}
              </p>
            </div>

            {/* Quantity Selector & Checkout */}
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
                    {Array.from({ length: Math.max(1, maxSelectable) }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Ticket" : "Tickets"}
                      </option>
                    ))}
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