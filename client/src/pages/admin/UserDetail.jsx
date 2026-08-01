import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../store/AuthContext";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { API } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch user details by ID
  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API}/api/users/${id}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load user details");

      setUser(data.user || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  // Handle Verify Organizer (PUT /verify/:id)
  const handleVerifyOrganizer = async () => {
    try {
      setActionLoading(true);
      setSuccessMsg("");

      const res = await fetch(`${API}/api/users/verify/${id}`, {
        method: "PUT",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");

      setSuccessMsg(data.message || "Organizer status updated");
      if (data.user) {
        setUser(data.user);
      } else {
        fetchUserDetails();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Active/Block (PUT /toggle-active/:id)
  const handleToggleActive = async () => {
    const actionText = user.isActive ? "block" : "activate";
    if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) return;

    try {
      setActionLoading(true);
      setSuccessMsg("");

      const res = await fetch(`${API}/api/users/toggle-active/${id}`, {
        method: "PUT",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");

      setSuccessMsg(data.message || "User status updated");
      
      // Update state directly from spread userObj response or refetch
      setUser((prev) => ({
        ...prev,
        isActive: !prev.isActive,
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete User (DELETE /:id)
  const handleDeleteUser = async () => {
    if (!window.confirm("WARNING: Are you sure you want to permanently delete this user?")) return;

    try {
      setActionLoading(true);
      const res = await fetch(`${API}/api/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user");

      alert("User deleted successfully.");
      navigate("/admin/users");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#34908B] font-semibold">
        Loading user details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto my-6 text-red-700 bg-red-100 border border-red-300 rounded-xl">
        {error}
      </div>
    );
  }

  if (!user) {
    return <div className="p-8 text-center text-gray-500">User not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="text-xs font-semibold text-[#34908B] hover:underline flex items-center gap-1"
      >
        ← Back to User List
      </button>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#A5E9DD] flex items-center justify-center text-2xl font-bold text-[#0f3d3a] overflow-hidden border">
            {user.profileImage ? (
              <img
                src={`${API}/uploads/${user.profileImage}`}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              user.name?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : user.role === "organizer"
                    ? "bg-blue-100 text-blue-700"
                    : user.role === "checker"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* ADMIN CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Verify Organizer Button */}
          {user.role === "organizer" && (
            <button
              onClick={handleVerifyOrganizer}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                user.organizer?.isVerified
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {user.organizer?.isVerified ? "Revoke Verification" : "✓ Verify Organizer"}
            </button>
          )}

          {/* Block / Activate Button */}
          <button
            onClick={handleToggleActive}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              user.isActive
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            }`}
          >
            {user.isActive ? "Block Account" : "Activate Account"}
          </button>

          {/* Delete User Button */}
          <button
            onClick={handleDeleteUser}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition"
          >
            Delete User
          </button>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic User Information */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <h2 className="text-lg font-bold text-[#34908B] border-b pb-2">
            Account Details
          </h2>
          <div className="text-sm space-y-2.5 text-gray-700">
            <p>
              <strong className="text-gray-900">Phone:</strong> {user.phone || "N/A"}
            </p>
            <p>
              <strong className="text-gray-900">Account Status: </strong>
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                  user.isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {user.isActive ? "Active" : "Blocked"}
              </span>
            </p>
            <p>
              <strong className="text-gray-900">Email Status:</strong>{" "}
              {user.isEmailVerified ? "Verified" : "Unverified"}
            </p>
            <p>
              <strong className="text-gray-900">Joined On:</strong>{" "}
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
            <p>
              <strong className="text-gray-900">Last Login:</strong>{" "}
              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>

        {/* Organizer Verification Details */}
        {user.role === "organizer" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <h2 className="text-lg font-bold text-[#34908B] border-b pb-2 flex items-center justify-between">
              <span>Organizer Application</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold ${
                  user.organizer?.isVerified
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {user.organizer?.isVerified ? "✓ Verified" : "⏳ Pending Approval"}
              </span>
            </h2>

            <div className="text-sm space-y-2 text-gray-700">
              <p>
                <strong className="text-gray-900">Organization Name:</strong>{" "}
                {user.organizer?.organizationName || "N/A"}
              </p>
              <p>
                <strong className="text-gray-900">Address:</strong>{" "}
                {user.organizer?.address || "N/A"}
              </p>
              <p>
                <strong className="text-gray-900">Website:</strong>{" "}
                {user.organizer?.website ? (
                  <a
                    href={user.organizer.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {user.organizer.website}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
              <p>
                <strong className="text-gray-900">Contact Phone:</strong>{" "}
                {user.organizer?.phone || "N/A"}
              </p>
              <p>
                <strong className="text-gray-900">Gov ID Info:</strong>{" "}
                {user.organizer?.govIDType} — {user.organizer?.govIDNumber}
              </p>
              <p>
                <strong className="text-gray-900">Description:</strong>{" "}
                {user.organizer?.description || "N/A"}
              </p>

              {/* ID Document Viewer */}
              {user.organizer?.govIDImage && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Government ID Document:
                  </p>
                  <a
                    href={`${API}/uploads/${user.organizer.govIDImage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block group"
                  >
                    <img
                      src={`${API}/uploads/${user.organizer.govIDImage}`}
                      alt="Gov ID Document"
                      className="w-full max-h-52 object-cover rounded-lg border group-hover:opacity-90 transition"
                    />
                    <span className="text-[11px] text-[#34908B] font-semibold mt-1 inline-block">
                      Click to view full image ↗
                    </span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}