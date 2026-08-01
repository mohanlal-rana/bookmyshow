import { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../../store/AuthContext";
import { useNavigate } from "react-router-dom";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedVerification, setSelectedVerification] = useState("all");

  const { API } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/api/users`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Search Query Match (Name or Email)
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);

      // 2. Role Filter Match
      const matchesRole =
        selectedRole === "all" ||
        user.role?.toLowerCase() === selectedRole.toLowerCase();

      // 3. Account Status Filter Match (Active/Blocked)
      const userStatus = user.isActive ? "active" : "blocked";
      const matchesStatus =
        selectedStatus === "all" || userStatus === selectedStatus;

      // 4. Organizer Verification Filter Match
      let matchesVerification = true;
      if (selectedVerification !== "all") {
        const isOrganizer = user.role === "organizer";
        const isVerified = Boolean(user.organizer?.isVerified);

        if (selectedVerification === "verified") {
          matchesVerification = isOrganizer && isVerified;
        } else if (selectedVerification === "unverified") {
          matchesVerification = isOrganizer && !isVerified;
        }
      }

      return (
        matchesSearch && matchesRole && matchesStatus && matchesVerification
      );
    });
  }, [users, searchTerm, selectedRole, selectedStatus, selectedVerification]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setSelectedVerification("all");
  };

  // Row click Handler to navigate to user details
  const handleRowClick = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const isFiltered =
    searchTerm !== "" ||
    selectedRole !== "all" ||
    selectedStatus !== "all" ||
    selectedVerification !== "all";

  if (loading) {
    return (
      <div className="p-8 text-center text-[#34908B] font-semibold">
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg my-4">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#34908B]">User Management</h1>
          <p className="text-gray-500 text-sm">
            Total Users: {users.length} | Showing: {filteredUsers.length}
          </p>
        </div>

        {/* Reset Filters Button */}
        {isFiltered && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-red-600 hover:text-red-800 underline self-start md:self-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#6FBEB2]"
          />
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Filter by Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#6FBEB2] bg-white"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="organizer">Organizer</option>
            <option value="checker">Checker</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Account Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Account Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#6FBEB2] bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Organizer Verification Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Organizer Verification
          </label>
          <select
            value={selectedVerification}
            onChange={(e) => setSelectedVerification(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#6FBEB2] bg-white"
          >
            <option value="all">All Organizers</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified / Pending</option>
          </select>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#6FBEB2] text-white text-sm">
              <tr>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Organization & Verification</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => handleRowClick(user._id)}
                    className="hover:bg-teal-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="p-3.5 font-medium text-gray-900 group-hover:text-[#34908B]">
                      {user.name}
                    </td>
                    <td className="p-3.5 text-gray-600">{user.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
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
                    </td>
                    <td className="p-3.5 text-gray-500 text-xs">
                      {user.role === "organizer" ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-800 text-sm">
                            {user.organizer?.organizationName || "N/A"}
                          </p>
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                              user.organizer?.isVerified
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {user.organizer?.isVerified
                              ? "✓ Verified"
                              : "⏳ Unverified / Pending"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Blocked
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-gray-500 text-sm"
                  >
                    No users found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}