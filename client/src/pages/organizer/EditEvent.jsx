export default function EditEvent() {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold text-[#34908B]">
        Edit Event
      </h1>

      <form className="mt-4 flex flex-col gap-3">
        <input className="p-2 border rounded" placeholder="Event Name" />
        <input className="p-2 border rounded" placeholder="Location" />

        <button className="bg-[#FDF4AF] text-black py-2 rounded">
          Update
        </button>
      </form>
    </div>
  );
}