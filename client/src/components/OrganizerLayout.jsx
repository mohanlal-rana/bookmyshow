import DashboardLayout from "./DashboardLayout";

export default function OrganizerLayout() {
  const links = [
    { name: "Dashboard", path: "/organizer/dashboard" },
    { name: "My Events", path: "/organizer/events" },
    { name: "Add Event", path: "/organizer/events/add" },
  ];

  return <DashboardLayout role="organizer" links={links} />;
}