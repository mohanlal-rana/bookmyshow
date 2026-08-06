import { useState, useContext } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../store/AuthContext";

export default function Login() {
  const { API, loginUser } = useContext(AuthContext); // 👈 Pull loginUser from Context
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // 👈 Fixed typo: negivate -> navigate

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      // 👈 Update AuthContext state immediately so the app re-renders as logged in
      if (data.user) {
        loginUser(data.user);
      }

      alert("Login successful!");
      navigate("/");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF4AF]">
      <div className="w-full max-w-md bg-[#A5E9DD] p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-[#0f3d3a] mb-6">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg outline-none"
          />

          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#34908B] text-white py-2 rounded-lg hover:bg-[#2f7f7a] transition font-semibold disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}