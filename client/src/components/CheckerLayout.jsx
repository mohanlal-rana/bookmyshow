import React from "react";
import DashboardLayout from "./DashboardLayout";

export default function CheckerLayout() {
  const links = [
    { name: "Dashboard", path: "/checker/dashboard" },
    { name: "QR Scanner", path: "/checker/scan" },
    { name: "Search Booking", path: "/checker/lookup" },
  ];

  return <DashboardLayout role="checker" links={links} />;
}