import { useState, useContext } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../store/AuthContext";

export default function Login() {
  const { API, loginUser } = useContext(AuthContext);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // State for field-specific errors: e.g. { email: "Invalid email address", password: "Password is required" }
  const [fieldErrors, setFieldErrors] = useState({});
  // General server / auth error state (e.g. "Invalid credentials")
  const [serverError, setServerError] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error as user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setServerError("");

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

      if (!res.ok) {
        // Handle field-specific validation errors if returned from backend Zod/Express middleware
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const errorsObj = {};
          data.errors.forEach((err) => {
            if (!errorsObj[err.field]) {
              errorsObj[err.field] = err.message;
            }
          });
          setFieldErrors(errorsObj);
        } else {
          setServerError(data.message || "Invalid credentials. Please try again.");
        }
        return;
      }

      if (data.user) {
        loginUser(data.user);
      }

      navigate("/");
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF4AF] p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#8ce3d3]">
        <h2 className="text-3xl font-extrabold text-center text-[#0f3d3a] mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-[#276e69] text-sm mb-6 font-medium">
          Please enter your credentials to log in.
        </p>

        {/* Global Server Error Banner */}
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm font-medium text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-[#0f3d3a] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-lg text-gray-800 bg-white/90 outline-none transition border ${
                fieldErrors.email
                  ? "border-red-500 ring-2 ring-red-200"
                  : "border-gray-300 focus:border-[#34908B] focus:ring-2 focus:ring-[#34908B]/30"
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-[#0f3d3a] uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 pr-10 rounded-lg text-gray-800 bg-white/90 outline-none transition border ${
                  fieldErrors.password
                    ? "border-red-500 ring-2 ring-red-200"
                    : "border-gray-300 focus:border-[#34908B] focus:ring-2 focus:ring-[#34908B]/30"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#34908B] text-white py-3 rounded-lg hover:bg-[#2f7f7a] focus:ring-4 focus:ring-[#34908B]/40 transition font-bold shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}