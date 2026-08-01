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
      ];
    }

    if (role === "checker") {
      return [
        { name: "Dashboard", path: "/checker/dashboard" },
        { name: "Scan Ticket", path: "/checker/scan" },
      ];
    }

    return [{ name: "Home", path: "/" }];
  };

  const links = getLinks();

  return (
    <header className="sticky top-0 z-50 bg-[#6FBEB2] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="text-2xl font-bold">
          🎟 EventHub
        </Link>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="hover:text-[#FDF4AF] transition font-medium"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* RIGHT SIDE */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-[#34908B] hover:bg-[#2f7f7a] transition font-medium"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg bg-[#A5E9DD] text-black hover:bg-[#8ee0d3] transition font-medium"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {/* Show "Become an Organizer" button only for normal users */}
              {role === "user" && (
                <Link
                  to="/upgrade-to-organizer"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FDF4AF] text-[#0f3d3a] hover:bg-[#f3e583] transition"
                >
                  🚀 Become an Organizer
                </Link>
              )}

              <span className="text-sm font-medium">
                Hi, {user?.name}
              </span>

              <Link
                to="/profile"
                className="px-4 py-2 rounded-lg bg-[#34908B] hover:bg-[#2f7f7a] transition font-medium"
              >
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition font-medium"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-3xl focus:outline-none"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden border-t border-white/20 bg-[#6FBEB2]">
          <div className="flex flex-col p-4 gap-3">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="py-2 font-medium hover:text-[#FDF4AF]"
              >
                {link.name}
              </Link>
            ))}

            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="bg-[#34908B] py-2 rounded text-center font-medium"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="bg-[#A5E9DD] text-black py-2 rounded text-center font-medium"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <div className="border-t border-white/20 pt-3 font-semibold text-center">
                  Hi, {user?.name}
                </div>

                {role === "user" && (
                  <Link
                    to="/upgrade-to-organizer"
                    onClick={() => setIsOpen(false)}
                    className="bg-[#FDF4AF] text-[#0f3d3a] py-2 rounded text-center font-bold text-sm"
                  >
                    🚀 Become an Organizer
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="bg-[#34908B] py-2 rounded text-center font-medium"
                >
                  Profile
                </Link>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="bg-red-500 py-2 rounded font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}