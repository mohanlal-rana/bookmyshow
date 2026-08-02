import { useContext, useState } from "react";
import { AuthContext } from "../store/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoggedIn, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser(navigate);
  };

  const role = user?.role;

  // Determine navigation links dynamically based on role
  const getLinks = () => {
    if (role === "admin") {
      return [
        { name: "Dashboard", path: "/admin/dashboard" },
        { name: "Users", path: "/admin/users" },
        { name: "Events", path: "/admin/events" },
      ];
    }

    if (role === "organizer") {
      return [
        { name: "Dashboard", path: "/organizer/dashboard" },
        { name: "My Events", path: "/organizer/events" },
        { name: "Add Event", path: "/organizer/events/add" },
        { name: "Bookings", path: "/organizer/bookings" },
      ];
    }

    if (role === "checker") {
      return [
        { name: "Dashboard", path: "/checker/dashboard" },
        { name: "Scan Ticket", path: "/checker/scan" },
      ];
    }

    // Standard User Links
    const userLinks = [{ name: "Home", path: "/" }];
    if (isLoggedIn) {
      userLinks.push({ name: "My Bookings", path: "/my-bookings" });
    }
    return userLinks;
  };

  const links = getLinks();

  // Helper badge color per role
  const getRoleBadgeClass = () => {
    switch (role) {
      case "admin":
        return "bg-purple-800 text-purple-100";
      case "organizer":
        return "bg-emerald-800 text-emerald-100";
      case "checker":
        return "bg-amber-800 text-amber-100";
      default:
        return "bg-[#34908B] text-white";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#6FBEB2] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="text-2xl font-bold tracking-tight hover:opacity-90 transition">
          🎟 EventHub
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="hover:text-[#FDF4AF] transition font-medium text-sm tracking-wide"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* RIGHT ACTION BUTTONS */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm rounded-lg bg-[#34908B] hover:bg-[#2f7f7a] transition font-medium"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="px-4 py-2 text-sm rounded-lg bg-[#A5E9DD] text-slate-900 hover:bg-[#8ee0d3] transition font-semibold"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {/* Upgrade Prompt for Standard Users */}
              {role === "user" && (
                <Link
                  to="/upgrade-to-organizer"
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FDF4AF] text-[#0f3d3a] hover:bg-[#f3e583] transition shadow-sm"
                >
                  🚀 Become an Organizer
                </Link>
              )}

              {/* User Identity & Role Badge */}
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/10">
                <span className="text-sm font-semibold max-w-[120px] truncate">
                  {user?.name}
                </span>
                {role && (
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${getRoleBadgeClass()}`}
                  >
                    {role}
                  </span>
                )}
              </div>

              <Link
                to="/profile"
                className="px-3.5 py-1.5 text-sm rounded-lg bg-[#34908B] hover:bg-[#2f7f7a] transition font-medium"
              >
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 text-sm rounded-lg bg-rose-500 hover:bg-rose-600 transition font-medium shadow-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* MOBILE TOGGLE BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-2xl p-1 rounded hover:bg-white/10 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden border-t border-white/20 bg-[#6FBEB2] shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col p-4 gap-3">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="py-2 text-base font-medium hover:text-[#FDF4AF] transition"
              >
                {link.name}
              </Link>
            ))}

            {!isLoggedIn ? (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="bg-[#34908B] py-2.5 rounded-lg text-center font-medium"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="bg-[#A5E9DD] text-slate-900 py-2.5 rounded-lg text-center font-bold"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between py-1">
                  <span className="font-semibold text-sm">
                    Hi, {user?.name}
                  </span>
                  {role && (
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${getRoleBadgeClass()}`}
                    >
                      {role}
                    </span>
                  )}
                </div>

                {role === "user" && (
                  <Link
                    to="/upgrade-to-organizer"
                    onClick={() => setIsOpen(false)}
                    className="bg-[#FDF4AF] text-[#0f3d3a] py-2 rounded-lg text-center font-bold text-sm"
                  >
                    🚀 Become an Organizer
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="bg-[#34908B] py-2 rounded-lg text-center font-medium"
                >
                  Profile
                </Link>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="bg-rose-500 hover:bg-rose-600 py-2 rounded-lg font-medium transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}