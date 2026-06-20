import { Outlet, Link, useLocation } from "react-router-dom";

export default function DashboardLayout({ role = "admin", links = [] }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#6FBEB2] text-white p-4">
        <h1 className="text-2xl font-bold mb-6">
          🎟 {role === "admin" ? "Admin Panel" : "Organizer Panel"}
        </h1>

        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 rounded-lg transition ${
                location.pathname === link.path
                  ? "bg-[#34908B]"
                  : "hover:bg-[#34908B]"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}