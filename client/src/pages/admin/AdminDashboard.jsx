export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#34908B]">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#A5E9DD] p-4 rounded-xl">
          Users Stats
        </div>
        <div className="bg-[#A5E9DD] p-4 rounded-xl">
          Events Stats
        </div>
        <div className="bg-[#A5E9DD] p-4 rounded-xl">
          Revenue Stats
        </div>
      </div>
    </div>
  );
}