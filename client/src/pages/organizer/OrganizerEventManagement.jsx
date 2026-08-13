import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../store/AuthContext";

export default function OrganizerEventManagement() {
  const { API } = useContext(AuthContext);
  const navigate = useNavigate();

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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

  // Check whether a show is completed by status or end date-time
  const isShowCompleted = (show) => {
    if (show.status === "completed") return true;
    if (!show.date || !show.endTime) return false;

    const formattedDate = new Date(show.date).toISOString().split("T")[0];
    const showEndDateTime = new Date(`${formattedDate}T${show.endTime}:00`);
    return new Date() >= showEndDateTime;
  };

  const handleDelete = async (showId) => {
    if (
      !window.confirm("Are you sure you want to delete this completed show?")
    ) {
      return;
    }

    try {
      setDeletingId(showId);
      const res = await fetch(`${API}/api/shows/organizer/shows/${showId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete show");
      }

      setShows((prevShows) => prevShows.filter((s) => s._id !== showId));
      alert("Show deleted successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-[#34908B] font-semibold">Loading events...</div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600 font-semibold">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#34908B] mb-4">My Events</h1>

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
            {shows.map((show) => {
              const imgPath = show.bannerImage || show.image;
              const imageUrl = imgPath
                ? imgPath.startsWith("http")
                  ? imgPath
                  : `${API}/${imgPath.replace(/^\//, "")}`
                : "/placeholder.png";

              const canDelete = isShowCompleted(show);

              return (
                <tr key={show._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-3">
                      <img
                        src={imageUrl}
                        alt={show.name}
                        className="w-10 h-10 rounded object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/150";
                        }}
                      />
                      <span>{show.name}</span>
                    </div>
                  </td>

                  <td className="p-3">{show.genre}</td>
                  <td className="p-3">{show.venue?.city}</td>
                  <td className="p-3">
                    {new Date(show.date).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {show.availableTickets} / {show.totalTickets}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        show.status === "published"
                          ? "bg-green-100 text-green-700"
                          : show.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {show.status}
                    </span>
                  </td>

                  <td className="p-3">{show.views}</td>

                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          navigate(`/organizer/events/${show._id}`)
                        }
                        className="bg-[#34908B] hover:bg-[#2b7a75] text-white px-3 py-1.5 rounded-md text-sm transition"
                      >
                        View
                      </button>

                      <button
                        onClick={() => handleDelete(show._id)}
                        disabled={!canDelete || deletingId === show._id}
                        title={
                          !canDelete
                            ? "Shows can only be deleted after they are completed."
                            : "Delete Show"
                        }
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                          canDelete
                            ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {deletingId === show._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {shows.length === 0 && (
          <div className="p-6 text-center text-gray-500">No events found.</div>
        )}
      </div>
    </div>
  );
}
