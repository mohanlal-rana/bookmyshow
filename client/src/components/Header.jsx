import { useContext, useState } from "react";
import { AuthContext } from "../store/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const { user, isLoggedIn, logoutUser } =
    useContext(AuthContext);

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
        { name: "Dashboard", path: "/owner/dashboard" },
        { name: "My Events", path: "/owner/events" },
        { name: "Add Event", path: "/owner/events/add" },
      ];
    }

    return [
      { name: "Home", path: "/" },
    ];
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
              className="hover:text-[#FDF4AF] transition"
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
                className="px-4 py-2 rounded-lg bg-[#34908B]"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg bg-[#A5E9DD] text-black"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <span className="text-sm">
                Hi, {user?.name}
              </span>

              <Link
                to="/profile"
                className="px-4 py-2 rounded-lg bg-[#34908B]"
              >
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-3xl"
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
                className="py-2"
              >
                {link.name}
              </Link>
            ))}

            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="bg-[#34908B] py-2 rounded text-center"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="bg-[#A5E9DD] text-black py-2 rounded text-center"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <div className="border-t pt-3">
                  {user?.name}
                </div>

                <Link
                  to="/profile"
                  className="bg-[#34908B] py-2 rounded text-center"
                >
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="bg-red-500 py-2 rounded"
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