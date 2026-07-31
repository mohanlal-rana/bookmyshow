import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const API = import.meta.env.VITE_API;
  const navigate = useNavigate();

  const [shows, setShows] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchShows = async () => {
    setLoading(true);
    try {
      // Build query string dynamically from filter controls
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (city) queryParams.append("city", city);
      if (genre) queryParams.append("genre", genre);

      const res = await fetch(`${API}/api/shows`);
      const data = await res.json();

      setShows(data.shows || []);
    } catch (err) {
      console.error("Failed to fetch shows:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchShows();
  };

  return (
    <div className="min-h-screen bg-[#FDF4AF]">
      {/* HERO SECTION */}
      <div className="bg-[#6FBEB2] text-white py-20 px-4 text-center rounded-b-3xl shadow-lg">
        <h1 className="text-4xl md:text-5xl font-bold">
          Book Amazing Shows 🎟️
        </h1>
        <p className="mt-3 text-sm md:text-base opacity-90">
          Discover concerts, events & experiences near you
        </p>

        {/* SEARCH FORM */}
        <form
          onSubmit={handleSearch}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <input
            className="px-4 py-2 rounded-lg text-black outline-none w-52 shadow-sm focus:ring-2 focus:ring-[#34908B]"
            placeholder="Search shows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            className="px-4 py-2 rounded-lg text-black outline-none w-40 shadow-sm focus:ring-2 focus:ring-[#34908B]"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <select
            className="px-4 py-2 rounded-lg text-black outline-none w-40 shadow-sm focus:ring-2 focus:ring-[#34908B] bg-white"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">All Genres</option>
            <option value="Concert">Concert</option>
            <option value="Music">Music</option>
            <option value="Comedy">Comedy</option>
            <option value="Festival">Festival</option>
            <option value="Theatre">Theatre</option>
            <option value="DJ Night">DJ Night</option>
            <option value="Sports">Sports</option>
            <option value="Other">Other</option>
          </select>

          <button
            type="submit"
            className="bg-[#34908B] hover:bg-[#2f7f7a] px-6 py-2 rounded-lg font-semibold transition text-white shadow"
          >
            Search
          </button>
        </form>
      </div>

      {/* SHOWS SECTION */}
      <div className="px-6 py-10 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-[#34908B] mb-6">
          Popular Shows
        </h2>

        {loading ? (
          <div className="text-center py-12 text-[#34908B] font-semibold text-lg">
            Loading shows...
          </div>
        ) : shows.length === 0 ? (
          <div className="text-center py-12 text-gray-700 font-medium">
            No shows found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shows.map((show) => (
              <div
                key={show._id}
                className="bg-[#A5E9DD] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition flex flex-col justify-between border border-[#8ce0d2]"
              >
                <div>
                  {/* Banner Image Display */}
                  {show.bannerImage ? (
                    <img
                      src={
                        show.bannerImage.startsWith("http")
                          ? show.bannerImage
                          : `${API}/${show.bannerImage}`
                      }
                      alt={show.name}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-r from-[#34908B] to-[#2b7873] flex items-center justify-center text-white font-bold text-lg px-2 text-center">
                      {show.name}
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-bold text-[#0f3d3a] line-clamp-1">
                        {show.name}
                      </h3>
                      <span className="bg-[#34908B] text-white text-xs px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                        {show.price ? `Rs. ${show.price}` : "Free"}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-[#184e4a]">
                      <p className="flex items-center gap-1">
                        <span>🎭</span> {show.genre}
                      </p>
                      <p className="flex items-center gap-1">
                        <span>📍</span> {show.venue?.city || "Location TBA"}
                      </p>
                      {show.date && (
                        <p className="flex items-center gap-1">
                          <span>📅</span>{" "}
                          {new Date(show.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => navigate(`/event/${show._id}`)}
                    className="w-full bg-[#34908B] text-white py-2 rounded-lg font-medium hover:bg-[#2f7f7a] transition shadow-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}