import { useEffect, useState } from "react";

export default function Home() {
  const [shows, setShows] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(false);

const fetchShows = async () => {
  setLoading(true);
  try {

    const res = await fetch("http://localhost:5000/api/shows");
    const data = await res.json();
    console.log(data)

    setShows(data.shows || []);
  } catch (err) {
    console.error(err);
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

        {/* SEARCH */}
        <form
          onSubmit={handleSearch}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <input
            className="px-4 py-2 rounded-lg text-black outline-none w-52"
            placeholder="Search shows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            className="px-4 py-2 rounded-lg text-black outline-none w-40"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <input
            className="px-4 py-2 rounded-lg text-black outline-none w-40"
            placeholder="Genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />

          <button
            type="submit"
            className="bg-[#34908B] hover:bg-[#2f7f7a] px-6 py-2 rounded-lg font-semibold transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* SHOWS SECTION */}
      <div className="px-6 py-10">
        <h2 className="text-2xl font-bold text-[#34908B] mb-6">
          Popular Shows
        </h2>

        {loading ? (
          <p className="text-gray-700">Loading...</p>
        ) : shows.length === 0 ? (
          <p className="text-gray-700">No shows found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {shows.map((show) => (
              <div
                key={show._id}
                className="bg-[#A5E9DD] rounded-xl p-4 shadow-md hover:shadow-xl transition"
              >
                <h3 className="text-lg font-bold text-[#0f3d3a]">
                  {show.name}
                </h3>

                <p className="text-sm mt-1">
                  🎭 {show.genre}
                </p>

                <p className="text-sm">
                  📍 {show.venue?.city}
                </p>

                <button className="mt-4 w-full bg-[#34908B] text-white py-2 rounded-lg hover:bg-[#2f7f7a] transition">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}