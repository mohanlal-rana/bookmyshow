import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EventManagement() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API = import.meta.env.VITE_API;
  const navigate = useNavigate();

  const fetchShows = async () => {
    try {
      const res = await fetch(`${API}/api/shows`, {
        method: "GET",
        credentials: "include",
      });

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

  if (loading) return <p className="p-4">Loading events...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#34908B]">
        Event Management
      </h1>

      <div className="mt-4 bg-white shadow rounded-xl overflow-x-auto">

        <table className="w-full text-left">

          {/* HEADER */}
          <thead className="bg-[#6FBEB2] text-white">
            <tr>
              <th className="p-3">Event</th>
              <th className="p-3">Organizer</th>
              <th className="p-3">Email</th>
              <th className="p-3">Venue</th>
              <th className="p-3">Date</th>
              <th className="p-3">Tickets</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>

            {shows.map((show) => (
              <tr
                key={show._id}
                className="border-b hover:bg-gray-50"
              >

                {/* EVENT NAME */}
                <td className="p-3 font-medium">
                  {show.name}
                </td>

                {/* ORGANIZER NAME */}
                <td className="p-3">
                  {show.organizerId?.name || "N/A"}
                </td>

                {/* ORGANIZER EMAIL */}
                <td className="p-3 text-sm text-gray-600">
                  {show.organizerId?.email || "N/A"}
                </td>

                {/* VENUE */}
                <td className="p-3">
                  {show.venue?.name}, {show.venue?.city}
                </td>

                {/* DATE */}
                <td className="p-3">
                  {new Date(show.date).toLocaleDateString()}
                </td>

                {/* TICKETS */}
                <td className="p-3">
                  {show.availableTickets}/{show.totalTickets}
                </td>

                {/* STATUS */}
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      show.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {show.status}
                  </span>
                </td>

                {/* ACTION */}
                <td className="p-3">
                  <button
                    onClick={() =>
                      navigate(`/admin/events/${show._id}`)
                    }
                    className="bg-[#34908B] text-white px-3 py-1 rounded hover:bg-[#2f7f7a]"
                  >
                    View
                  </button>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>
    </div>
  );
}