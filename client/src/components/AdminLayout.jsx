import DashboardLayout from "./DashboardLayout";

export default function AdminLayout() {
  const links = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Users", path: "/admin/users" },
    { name: "Events", path: "/admin/events" },
  ];

  return <DashboardLayout role="admin" links={links} />;
}