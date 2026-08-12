import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../store/AuthContext.jsx";

export default function Profile() {
  const { API, user, isLoggedIn, isLoading, logoutUser } =
    useContext(AuthContext);

  const [savedShows, setSavedShows] = useState([]);
  const [loadingShows, setLoadingShows] = useState(true);

  // Fetch populated saved shows
  useEffect(() => {
    const fetchSavedShows = async () => {
      try {
        const res = await fetch(`${API}/api/shows/saved-shows`, {
          headers: {
          },
          credentials: "include", // Include cookies for authentication
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSavedShows(data.savedShows);
        }
      } catch (error) {
        console.error("Error fetching saved shows:", error);
      } finally {
        setLoadingShows(false);
      }
    };

    if (isLoggedIn) {
      fetchSavedShows();
    }
  }, [API, isLoggedIn]);

  // Remove show from saved list directly in Profile
  const handleRemoveSaved = async (showId) => {
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
        setSavedShows((prev) => prev.filter((show) => show._id !== showId));
      }
    } catch (error) {
      console.error("Error removing saved show:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
          <p className="text-gray-500 mb-6">
            Please log in to your account to view your profile details.
          </p>
          <a
            href="/login"
            className="inline-block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition duration-200 shadow-sm"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-12 mb-6 gap-4">
              <div className="flex items-end space-x-4">
                <div className="relative">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-white shadow-md bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white uppercase">
                      {user.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                      user.isActive ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                    title={user.isActive ? "Active" : "Inactive"}
                  />
                </div>

                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    {user.organizer?.isVerified && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className="px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                  {user.role}
                </span>
                <button
                  onClick={() => logoutUser()}
                  className="px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition duration-200 border border-rose-100"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="p-3 bg-gray-50/80 rounded-xl text-center">
                <span className="block text-xl font-bold text-gray-900">
                  {savedShows.length}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  Saved Shows
                </span>
              </div>
              <div className="p-3 bg-gray-50/80 rounded-xl text-center">
                <span className="block text-xl font-bold text-gray-900">
                  {user.bookings?.length || 0}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  Bookings
                </span>
              </div>
              <div className="p-3 bg-gray-50/80 rounded-xl text-center">
                <span className="block text-xl font-bold text-gray-900">
                  {user.saved?.length || 0}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  Saved Rooms
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Shows Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Saved Shows ({savedShows.length})
            </h2>
          </div>

          {loadingShows ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              Loading saved shows...
            </div>
          ) : savedShows.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              You haven't saved any shows yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedShows.map((show) => (
                <div
                  key={show._id}
                  className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    {show.bannerImage ? (
                      <img
                        src={
                          show.bannerImage.startsWith("http")
                            ? show.bannerImage
                            : `${API}/${show.bannerImage}`
                        }
                        alt={show.name}
                        className="w-full h-36 object-cover"
                      />
                    ) : (
                      <div className="w-full h-36 bg-indigo-500 flex items-center justify-center text-white font-bold px-2 text-center">
                        {show.name}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-gray-900 line-clamp-1">
                          {show.name}
                        </h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {show.price ? `Rs. ${show.price}` : "Free"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        🎭 {show.genre || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">
                        📍 {show.venue?.city || "TBA"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex gap-2">
                    <Link
                      to={`/event/${show._id}`}
                      className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 rounded-lg transition"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleRemoveSaved(show._id)}
                      className="px-3 bg-rose-100 hover:bg-rose-200 text-rose-600 text-xs font-medium py-2 rounded-lg transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Account Overview
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Email Verification</dt>
                <dd className="font-medium">
                  {user.isEmailVerified ? (
                    <span className="text-emerald-600">Verified</span>
                  ) : (
                    <span className="text-amber-600">Pending Verification</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Account Status</dt>
                <dd className="font-medium text-gray-900">
                  {user.isBlocked ? (
                    <span className="text-rose-600">Blocked</span>
                  ) : user.isActive ? (
                    <span className="text-emerald-600">Active</span>
                  ) : (
                    <span className="text-gray-500">Inactive</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Member Since</dt>
                <dd className="font-medium text-gray-900">
                  {formatDate(user.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Last Login</dt>
                <dd className="font-medium text-gray-900">
                  {formatDate(user.lastLogin)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Role Details ({user.role})
            </h2>
            {user.role === "organizer" ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Organizer Status</dt>
                  <dd className="font-medium text-gray-900">
                    {user.organizer?.isVerified ? "Verified Partner" : "Standard"}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="text-sm text-gray-500">
                You are currently registered as a standard user. Browse rooms and save
                your favorite rentals.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}