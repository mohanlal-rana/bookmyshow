import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../store/AuthContext";

export default function OrganizerEventDetail() {
  const { API } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchShow = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API}/api/shows/organizer/shows/${id}`, {
          credentials: "include",
        });

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

    fetchShow();
  }, [API, id]);

  const handleEdit = () => {
    navigate(`/organizer/events/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this show?")) return;

    try {
      setDeleting(true);
      const res = await fetch(`${API}/api/shows/organizer/shows/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete show");
      }

      navigate("/organizer/shows");
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-lg font-semibold text-[#34908B]">
        Loading event details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center text-red-600 font-semibold bg-red-50 rounded-xl max-w-2xl mx-auto mt-6 border border-red-200">
        {error}
      </div>
    );
  }

  if (!show) {
    return (
      <div className="p-12 text-center text-gray-500 font-medium">
        Show not found.
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700 border-green-300";
      case "draft":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Banner Image */}
      {show.bannerImage ? (
        <img
          src={
            show.bannerImage.startsWith("http")
              ? show.bannerImage
              : `${API}/${show.bannerImage}`
          }
          alt={show.name}
          className="w-full h-80 object-cover rounded-xl shadow"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-r from-[#34908B] to-[#2b7873] rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow">
          {show.name}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 mt-6">
        {/* Header row: Title + Actions */}
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[#34908B]">
                {show.name}
              </h1>
              {show.isVerified && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded border">
                {show.genre}
              </span>

              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded border uppercase ${getStatusBadge(
                  show.status
                )}`}
              >
                {show.status}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition ${
                deleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h2 className="font-bold text-lg text-gray-800 mb-1">Description</h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {show.description}
          </p>
        </div>

        {/* Tags */}
        {show.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
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

        <hr className="my-6" />

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h2 className="font-bold text-lg text-gray-800 mb-3">
              Event Schedule & Stats
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Date:</strong>{" "}
                {new Date(show.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <strong>Time:</strong> {show.startTime} – {show.endTime}
              </p>
              <p>
                <strong>Genre:</strong> {show.genre}
              </p>
              <p>
                <strong>Total Views:</strong> {show.views || 0}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h2 className="font-bold text-lg text-gray-800 mb-3">
              Venue Details
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Name:</strong> {show.venue?.name}
              </p>
              <p>
                <strong>City:</strong> {show.venue?.city}
              </p>
              <p>
                <strong>Address:</strong> {show.venue?.address}
              </p>
            </div>
          </div>
        </div>

        <hr className="my-6" />

        {/* Tickets & Policies */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h2 className="font-bold text-lg text-gray-800 mb-3">
              Ticket Information
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="text-base text-[#34908B] font-semibold">
                <strong>Price per Ticket:</strong> Rs. {show.price}
              </p>
              <p>
                <strong>Total Capacity:</strong> {show.totalTickets}
              </p>
              <p>
                <strong>Available Tickets:</strong> {show.availableTickets}
              </p>
              <p>
                <strong>Sold Tickets:</strong> {show.soldTickets || 0}
              </p>
              <p>
                <strong>Max Tickets Per User:</strong> {show.maxTicketsPerUser}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h2 className="font-bold text-lg text-gray-800 mb-3">
              Booking Policy & Security
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Booking Deadline:</strong>{" "}
                {show.bookingDeadline
                  ? new Date(show.bookingDeadline).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <strong>Refund Policy:</strong>{" "}
                {show.refundPolicy || "No refund available"}
              </p>
              <p>
                <strong>QR Check-in Enabled:</strong>{" "}
                {show.qrEnabled ? (
                  <span className="text-green-600 font-medium">Yes</span>
                ) : (
                  <span className="text-red-500 font-medium">No</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Artists Section */}
        {show.artists?.length > 0 && (
          <>
            <hr className="my-6" />
            <div>
              <h2 className="font-bold text-lg text-gray-800 mb-4">
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
                        className="w-20 h-20 rounded-full object-cover border-2 border-[#34908B] shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#34908B] text-white flex items-center justify-center text-xl font-bold border-2 border-[#34908B] shadow-sm">
                        {artist.name ? artist.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                    <p className="mt-2 font-medium text-gray-800 text-sm">
                      {artist.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}