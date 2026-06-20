export default function AddEvent() {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold text-[#34908B]">
        Create Event
      </h1>

      <form className="mt-4 flex flex-col gap-3">
        <input className="p-2 border rounded" placeholder="Event Name" />
        <input className="p-2 border rounded" placeholder="Location" />
        <input className="p-2 border rounded" placeholder="Date" />

        <button className="bg-[#34908B] text-white py-2 rounded">
          Create
        </button>
      </form>
    </div>
  );
}