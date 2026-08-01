import DashboardLayout from "./DashboardLayout";

export default function OrganizerLayout() {
  const links = [
    { name: "Dashboard", path: "/organizer/dashboard" },
    { name: "My Events", path: "/organizer/events" },
    { name: "Add Event", path: "/organizer/events/add" },
    { name: "Booking", path: "/organizer/bookings" },
  ];

  return <DashboardLayout role="organizer" links={links} />;
}