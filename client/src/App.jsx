import Header from "./components/Header";
import Home from "./pages/Home";
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
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

export default function App() {
  return (
<BrowserRouter>
<Header />
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/signup" element={<Signup/>}/>
    <Route path="/login" element={<Login/>}/>
          // admin Routes
      <Route path='/admin' element={<AdminLayout/>}> 
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path='dashboard' element={<AdminDashboard/>}/>
        <Route path='users' element={<UserManagement/>}/>
        <Route path='users/:id' element={<UserDetail/>}/>
        <Route path='events' element={<EventManagement/>}/>
        <Route path='events/:id' element={<EventManagementDetails/>}/>
      </Route> 

      // owner Routes
      <Route path='/owner' element={<OrganizerLayout/>}> 
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path='dashboard' element={<OrganizerDashboard/>}/>
        <Route path='events' element={<OrganizerEventManagement/>}/>
        <Route path='events/add' element={<AddEvent/>}/>
        <Route path='events/:id' element={<OrganizerEventDetail/>}/>
        <Route path='events/edit/:id' element={<EditEvent/>}/>
      </Route>
  </Routes>
</BrowserRouter>
  )
}
