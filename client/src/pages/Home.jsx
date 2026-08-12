import { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../store/AuthContext";
import RecommendedShows from "./RecommendedShows.jsx";

export default function Home() {
  const { API, user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "checker") {
      navigate("/checker", { replace: true });
    }
  }, [user, navigate]);

  const [shows, setShows] = useState([]);
  const [savedEventIds, setSavedEventIds] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync saved events state from user context
  useEffect(() => {
    if (user && user.savedEvents) {
      setSavedEventIds(user.savedEvents.map((e) => (typeof e === "object" ? e._id : e)));
    }
  }, [user]);

  // Fetch shows dynamically with query params
  const fetchShows = useCallback(
    async (searchTerm = search, cityTerm = city, genreTerm = genre) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchTerm.trim()) queryParams.append("search", searchTerm.trim());
        if (cityTerm.trim()) queryParams.append("city", cityTerm.trim());
        if (genreTerm.trim()) queryParams.append("genre", genreTerm.trim());

        const queryString = queryParams.toString();
        const url = `${API}/api/shows/search${queryString ? `?${queryString}` : ""}`;

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.success) {
          setShows(data.shows || []);
        } else {
          setShows(data.shows || []);
        }
      } catch (err) {
        console.error("Failed to fetch shows:", err);
      } finally {
        setLoading(false);
      }
    },
    [API]
  );

  // Debounce search & city inputs for real-time filtering as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShows(search, city, genre);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, city, genre, fetchShows]);

  // Toggle Save Show Handler
  const handleToggleSave = async (e, showId) => {
    e.stopPropagation(); // Prevent navigating to details page

    try {
      const res = await fetch(`${API}/api/shows/saved/${showId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSavedEventIds(data.savedEvents);
      } else {
        alert(data.message || "Failed to save show.");
      }
    } catch (err) {
      console.error("Error toggling save show:", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchShows(search, city, genre);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCity("");
    setGenre("");
  };

  return (
    <div className="min-h-screen bg-[#FDF4AF]">
      {/* HERO SECTION */}
      <div className="bg-[#6FBEB2] text-white py-20 px-4 text-center rounded-b-3xl shadow-lg">
        <h1 className="text-4xl md:text-5xl font-bold">Book Amazing Shows 🎟️</h1>
        <p className="mt-3 text-sm md:text-base opacity-90">
          Discover concerts, events & experiences near you
        </p>

        {/* SEARCH FORM */}
        <form
          onSubmit={handleSearch}
          className="mt-8 flex flex-wrap justify-center items-center gap-3 max-w-4xl mx-auto"
        >
          <input
            className="px-4 py-2 rounded-lg text-black outline-none w-full sm:w-52 shadow-sm focus:ring-2 focus:ring-[#34908B]"
            placeholder="Search shows or artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            className="px-4 py-2 rounded-lg text-black outline-none w-full sm:w-40 shadow-sm focus:ring-2 focus:ring-[#34908B]"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <select
            className="px-4 py-2 rounded-lg text-black outline-none w-full sm:w-40 shadow-sm focus:ring-2 focus:ring-[#34908B] bg-white cursor-pointer"
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

          {(search || city || genre) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition text-sm backdrop-blur-sm"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <RecommendedShows />

      {/* SHOWS SECTION */}
      <div className="px-6 py-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#34908B]">
            {search || city || genre ? "Search Results" : "Popular Shows"}
          </h2>
          {!loading && (
            <span className="text-sm font-semibold text-[#184e4a]">
              {shows.length} {shows.length === 1 ? "show" : "shows"} found
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#34908B] font-semibold text-lg flex justify-center items-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#34908B]"></span>
            Loading shows...
          </div>
        ) : shows.length === 0 ? (
          <div className="text-center py-12 text-gray-700 font-medium bg-white/50 rounded-2xl border border-[#8ce0d2] max-w-md mx-auto">
            <p className="text-lg font-bold text-[#34908B]">No shows found</p>
            <p className="text-sm text-gray-600 mt-1">
              Try adjusting your search terms or filters.
            </p>
            {(search || city || genre) && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-xs font-bold text-[#34908B] hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shows.map((show) => {
              const isSaved = savedEventIds.includes(show._id);

              return (
                <div
                  key={show._id}
                  className="bg-[#A5E9DD] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition flex flex-col justify-between border border-[#8ce0d2] relative"
                >
                  {/* Save/Bookmark Button */}
                  <button
                    onClick={(e) => handleToggleSave(e, show._id)}
                    className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full shadow hover:bg-white transition"
                    title={isSaved ? "Unsave event" : "Save event"}
                  >
                    {isSaved ? "❤️" : "🤍"}
                  </button>

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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
