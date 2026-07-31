import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OrganizerEventManagement() {
  const API = import.meta.env.VITE_API;
  const navigate = useNavigate();

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchShows = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/shows/organizer/getShows`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch shows");
      }

      setShows(data.shows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-[#34908B] font-semibold">
        Loading events...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#34908B] mb-4">
        My Events
      </h1>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-[#34908B] text-white">
            <tr>
              <th className="p-3 text-left">Event</th>
              <th className="p-3 text-left">Genre</th>
              <th className="p-3 text-left">City</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Tickets</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Views</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {shows.map((show) => (
              <tr
                key={show._id}
                className="border-b hover:bg-gray-50"
              >
                {/* Event */}
                <td className="p-3 font-medium">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        show.image
                          ? show.image.startsWith("http")
                            ? show.image
                            : `${API}/${show.image}`
                          : "/placeholder.png"
                      }
                      alt={show.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <span>{show.name}</span>
                  </div>
                </td>

                {/* Genre */}
                <td className="p-3">{show.genre}</td>

                {/* City */}
                <td className="p-3">{show.venue?.city}</td>

                {/* Date */}
                <td className="p-3">
                  {new Date(show.date).toLocaleDateString()}
                </td>

                {/* Tickets */}
                <td className="p-3">
                  {show.availableTickets} / {show.totalTickets}
                </td>

                {/* Status */}
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      show.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {show.status}
                  </span>
                </td>

                {/* Views */}
                <td className="p-3">{show.views}</td>

                {/* Actions */}
                <td className="p-3 text-center">
                  <button
                    onClick={() =>
                      navigate(`/organizer/events/${show._id}`)
                    }
                    className="bg-[#34908B] hover:bg-[#2b7a75] text-white px-4 py-2 rounded-md text-sm transition"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {shows.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No events found.
          </div>
        )}
      </div>
    </div>
  );
}