import { useState } from "react";

export default function AddEvent() {
  const API = import.meta.env.VITE_API;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    genre: "Concert",
    image: null,
    date: "",
    startTime: "",
    endTime: "",
    venueName: "",
    city: "",
    address: "",
    totalTickets: "",
    availableTickets: "",
    maxTicketsPerUser: 5,
    refundPolicy: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setFieldErrors({});

      const form = new FormData();

      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("genre", formData.genre);

      if (formData.image) {
        form.append("image", formData.image);
      }

      form.append("date", formData.date);
      form.append("startTime", formData.startTime);
      form.append("endTime", formData.endTime);

      form.append(
        "venue",
        JSON.stringify({
          name: formData.venueName,
          city: formData.city,
          address: formData.address,
        })
      );

      form.append("totalTickets", formData.totalTickets);
      form.append("availableTickets", formData.availableTickets);
      form.append("maxTicketsPerUser", formData.maxTicketsPerUser);

      form.append("refundPolicy", formData.refundPolicy);

      // REQUIRED ticketTypes
      form.append(
        "ticketTypes",
        JSON.stringify([
          {
            name: "Standard",
            price: 0,
            quantity: Number(formData.totalTickets || 1),
          },
        ])
      );

      const res = await fetch(`${API}/api/shows`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        const errors = {};

        data.errors?.forEach((e) => {
          errors[e.field] = e.message;
        });

        setFieldErrors(errors);

        throw new Error(data.message || "Validation failed");
      }

      alert("Event Created Successfully!");

      setFormData({
        name: "",
        description: "",
        genre: "Concert",
        image: null,
        date: "",
        startTime: "",
        endTime: "",
        venueName: "",
        city: "",
        address: "",
        totalTickets: "",
        availableTickets: "",
        maxTicketsPerUser: 5,
        refundPolicy: "",
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow">

      <h1 className="text-3xl font-bold text-[#34908B] mb-6">
        Create Event
      </h1>

      {/* GLOBAL ERROR */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 whitespace-pre-line">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">

        {/* NAME */}
        <div>
          <input
            type="text"
            name="name"
            placeholder="Event Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
          {fieldErrors.name && (
            <p className="text-red-500 text-sm">{fieldErrors.name}</p>
          )}
        </div>

        {/* GENRE */}
        <select
          name="genre"
          value={formData.genre}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
        >
          <option>Concert</option>
          <option>Music</option>
          <option>Comedy</option>
          <option>Festival</option>
          <option>Theatre</option>
          <option>DJ Night</option>
          <option>Sports</option>
          <option>Other</option>
        </select>

        {/* DESCRIPTION */}
        <div className="md:col-span-2">
          <textarea
            name="description"
            rows="4"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
          {fieldErrors.description && (
            <p className="text-red-500 text-sm">{fieldErrors.description}</p>
          )}
        </div>

        {/* IMAGE */}
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
        />

        {/* DATE */}
        <div>
          <input
            type="date"
            name="date"
            value={formData.date}
            min={new Date().toISOString().split("T")[0]}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
          {fieldErrors.date && (
            <p className="text-red-500 text-sm">{fieldErrors.date}</p>
          )}
        </div>

        {/* START TIME */}
        <input
          type="time"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
        />

        {/* END TIME */}
        <input
          type="time"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
        />

        {/* VENUE NAME */}
        <div>
          <input
            type="text"
            name="venueName"
            placeholder="Venue Name"
            value={formData.venueName}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
          {fieldErrors["venue.name"] && (
            <p className="text-red-500 text-sm">{fieldErrors["venue.name"]}</p>
          )}
        </div>

        {/* CITY */}
        <div>
          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
          {fieldErrors["venue.city"] && (
            <p className="text-red-500 text-sm">{fieldErrors["venue.city"]}</p>
          )}
        </div>

        {/* ADDRESS */}
        <div className="md:col-span-2">
          <textarea
            name="address"
            rows="2"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
          {fieldErrors["venue.address"] && (
            <p className="text-red-500 text-sm">
              {fieldErrors["venue.address"]}
            </p>
          )}
        </div>

        {/* TOTAL TICKETS */}
        <input
          type="number"
          name="totalTickets"
          placeholder="Total Tickets"
          value={formData.totalTickets}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
        />

        {/* AVAILABLE */}
        <input
          type="number"
          name="availableTickets"
          placeholder="Available Tickets"
          value={formData.availableTickets}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
        />

        {/* MAX */}
        <input
          type="number"
          name="maxTicketsPerUser"
          placeholder="Max Tickets Per User"
          value={formData.maxTicketsPerUser}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
        />

        {/* REFUND */}
        <textarea
          name="refundPolicy"
          rows="3"
          placeholder="Refund Policy"
          value={formData.refundPolicy}
          onChange={handleChange}
          className="md:col-span-2 w-full p-3 border rounded-lg"
        />

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-2 bg-[#34908B] text-white py-3 rounded-lg font-semibold hover:bg-[#2b7873]"
        >
          {loading ? "Creating Event..." : "Create Event"}
        </button>

      </form>
    </div>
  );
}