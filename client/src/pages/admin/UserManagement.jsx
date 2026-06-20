import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../store/AuthContext";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { API } =
    useContext(AuthContext);
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

      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <p className="p-4">Loading users...</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-red-500">
        {error}
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#34908B]">
        User Management
      </h1>

      <div className="mt-4 bg-white shadow rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#6FBEB2] text-white">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3 capitalize">
                  {user.role}
                </td>
                <td className="p-3">
                  {user.isActive ? (
                    <span className="text-green-600">
                      Active
                    </span>
                  ) : (
                    <span className="text-red-600">
                      Blocked
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}