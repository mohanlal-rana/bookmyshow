import DashboardLayout from "./DashboardLayout";

export default function OrganizerLayout() {
  const links = [
    { name: "Dashboard", path: "/owner/dashboard" },
    { name: "My Events", path: "/owner/events" },
    { name: "Add Event", path: "/owner/events/add" },
  ];

  return <DashboardLayout role="organizer" links={links} />;
}