import { useEffect, useState } from "react";

export default function OrganizerEventManagement() {
  const API = import.meta.env.VITE_API;

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchShows = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API}/api/shows/organizer/getShows`,
        {
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch shows");
      }

      setShows(data.shows);
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
                        show.image?.startsWith("http")
                          ? show.image
                          : `${API}/${show.image}`
                      }
                      alt="event"
                      className="w-10 h-10 rounded object-cover"
                    />
                    {show.name}
                  </div>
                </td>

                {/* Genre */}
                <td className="p-3">{show.genre}</td>

                {/* City */}
                <td className="p-3">
                  {show.venue?.city}
                </td>

                {/* Date */}
                <td className="p-3">
                  {new Date(show.date).toDateString()}
                </td>

                {/* Tickets */}
                <td className="p-3">
                  {show.availableTickets} /{" "}
                  {show.totalTickets}
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
              </tr>
            ))}
          </tbody>
        </table>

        {shows.length === 0 && (
          <div className="p-6 text-gray-500">
            No events found
          </div>
        )}
      </div>
    </div>
  );
}