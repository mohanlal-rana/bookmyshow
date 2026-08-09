import Header from "./components/Header";
import Home from "./pages/Home";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import EventManagement from "./pages/admin/EventManagement";
import EventManagementDetails from "./pages/admin/EventManagementDetails";
import OrganizerLayout from "./components/OrganizerLayout";
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import OrganizerEventManagement from "./pages/organizer/OrganizerEventManagement";
import AddEvent from "./pages/organizer/AddEvent";
import OrganizerEventDetail from "./pages/organizer/OrganizerEventDetail";
import EditEvent from "./pages/organizer/EditEvent";
import UserDetail from "./pages/admin/UserDetail";
import EventDetail from "./pages/EventDetail";
import MakePayment from "./pages/MakePayment";
import PaymentSuccess from "./pages/PaymentSuccess"; // Import Payment Success handler
import PaymentFailure from "./pages/PaymentFailure"; // Import Payment Failure handler
import MyBookings from "./pages/MyBookings";
import TicketDetails from "./pages/TicketDetails";
import OrganizerBookings from "./pages/organizer/OrganizerBookings";
import UpgradeToOrganizer from "./pages/UpgradeToOrganizer";
import AdminBooking from "./pages/admin/AdminBooking";
import TicketScanner from "./pages/checker/TicketScanner";
import CheckerLayout from "./components/CheckerLayout";
import CheckerDashboard from "./pages/checker/CheckerDashboard";
import SearchTicket from "./pages/checker/SearchTicket";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* Public / User Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/booking/payment/:id" element={<MakePayment />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/booking/tickets/:bookingId" element={<TicketDetails />} />
        <Route path="/upgrade-to-organizer" element={<UpgradeToOrganizer />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="events" element={<EventManagement />} />
          <Route path="events/:id" element={<EventManagementDetails />} />
          <Route path="bookings" element={<AdminBooking />} />
        </Route>

        {/* Organizer Routes */}
        <Route path="/organizer" element={<OrganizerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<OrganizerDashboard />} />
          <Route path="events" element={<OrganizerEventManagement />} />
          <Route path="events/add" element={<AddEvent />} />
          <Route path="events/:id" element={<OrganizerEventDetail />} />
          <Route path="events/edit/:id" element={<EditEvent />} />
          <Route path="bookings" element={<OrganizerBookings />} />
        </Route>

        {/* Checker Routes */}
        <Route path="/checker" element={<CheckerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CheckerDashboard />} />
          <Route path="scan" element={<TicketScanner />} />
          <Route path="lookup" element={<SearchTicket />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}