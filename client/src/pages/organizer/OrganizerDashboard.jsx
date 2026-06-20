export default function OrganizerDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#34908B]">
        Organizer Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#A5E9DD] p-4 rounded-xl">
          My Events
        </div>
        <div className="bg-[#A5E9DD] p-4 rounded-xl">
          Bookings
        </div>
        <div className="bg-[#A5E9DD] p-4 rounded-xl">
          Earnings
        </div>
      </div>
    </div>
  );
}