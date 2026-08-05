import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../store/AuthContext";

export default function RecommendedShows() {
  const { user, API } = useContext(AuthContext);
  const navigate = useNavigate();

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendationType, setRecommendationType] = useState("personalized");

  useEffect(() => {
    // Only attempt to fetch if user is logged in
    if (!user) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/shows/recommended`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // 👈 Crucial for sending HTTP-only cookies with cross-origin or same-site requests
          credentials: "include", 
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setShows(data.shows || []);
          setRecommendationType(data.type || "personalized");
        }
      } catch (err) {
        console.error("Failed to load recommended shows:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, API]); // 👈 Depend on user instead of token

  // If user is not logged in or no shows exist, don't render the section
  if (!user || (!loading && shows.length === 0)) {
    return null;
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#34908B] flex items-center gap-2">
            <span>🎯</span>{" "}
            {recommendationType === "personalized"
              ? "Recommended For You"
              : "Trending Shows You Might Like"}
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            {recommendationType === "personalized"
              ? "Based on your past booking history & preferences"
              : "Popular events among ticket buyers"}
          </p>
        </div>

        {!loading && (
          <span className="text-sm font-semibold text-[#184e4a] bg-[#A5E9DD]/50 px-3 py-1 rounded-full">
            {shows.length} {shows.length === 1 ? "suggestion" : "suggestions"}
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-10 text-[#34908B] font-semibold flex justify-center items-center gap-2">
          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#34908B]"></span>
          Finding recommendations for you...
        </div>
      ) : (
        /* Shows Grid */
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
  );
}