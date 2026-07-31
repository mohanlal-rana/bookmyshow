import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddEvent() {
  const API = import.meta.env.VITE_API;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    genre: "Concert",
    bannerImage: null,
    date: "",
    startTime: "",
    endTime: "",
    venueName: "",
    city: "",
    address: "",
    totalTickets: "",
    availableTickets: "",
    price: "",
    maxTicketsPerUser: 5,
    refundPolicy: "No refund available",
    status: "published",
    bookingDeadline: "",
    tags: "", // Stored as plain string during input
    artists: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // ---- Artist handlers ----
  const addArtist = () => {
    setFormData((prev) => ({
      ...prev,
      artists: [...prev.artists, { name: "", image: "" }],
    }));
  };

  const removeArtist = (index) => {
    const updated = [...formData.artists];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, artists: updated }));
  };

  const updateArtist = (index, field, value) => {
    const updated = [...formData.artists];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, artists: updated }));
  };

  // ---- Generic change handler ----
  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // ---- Submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setFieldErrors({});

      const form = new FormData();

      // Basic fields
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("genre", formData.genre);
      form.append("date", formData.date);
      form.append("startTime", formData.startTime);
      form.append("endTime", formData.endTime);

      // Venue (Matches Schema Nested Structure)
      form.append(
        "venue",
        JSON.stringify({
          name: formData.venueName,
          city: formData.city,
          address: formData.address,
        })
      );

      // Numeric Ticket Details
      form.append("totalTickets", Number(formData.totalTickets));
      form.append("availableTickets", Number(formData.availableTickets));
      form.append("price", Number(formData.price));
      form.append("maxTicketsPerUser", Number(formData.maxTicketsPerUser));

      // Additional Metadata
      form.append("refundPolicy", formData.refundPolicy);
      form.append("status", formData.status);

      if (formData.bookingDeadline) {
        form.append("bookingDeadline", formData.bookingDeadline);
      }

      // Tags Array Conversion
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      form.append("tags", JSON.stringify(tagsArray));

      // Artists
      form.append("artists", JSON.stringify(formData.artists));

      // Banner Image File
      if (formData.bannerImage instanceof File) {
        form.append("bannerImage", formData.bannerImage);
      }

      const res = await fetch(`${API}/api/shows`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("Server Response:", text);
        throw new Error(
          "Server returned an invalid response. Check the backend terminal for details."
        );
      }

      if (!res.ok) {
        if (Array.isArray(data.errors)) {
          const errors = {};
          data.errors.forEach((err) => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
        }
        throw new Error(data.message || "Failed to create show.");
      }

      alert("Show created successfully!");
      navigate("/organizer/events");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-3xl font-bold text-[#34908B] mb-6">Create Show</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 whitespace-pre-line">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
        {/* ---- NAME ---- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Show Name *
          </label>
          <input
            type="text"
            name="name"
            placeholder="Event Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors.name && (
            <p className="text-red-500 text-sm">{fieldErrors.name}</p>
          )}
        </div>

        {/* ---- GENRE ---- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genre *
          </label>
          <select
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          >
            <option value="Concert">Concert</option>
            <option value="Music">Music</option>
            <option value="Comedy">Comedy</option>
            <option value="Festival">Festival</option>
            <option value="Theatre">Theatre</option>
            <option value="DJ Night">DJ Night</option>
            <option value="Sports">Sports</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* ---- DESCRIPTION ---- */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            rows="4"
            placeholder="Describe your show (10-2000 characters)..."
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors.description && (
            <p className="text-red-500 text-sm">{fieldErrors.description}</p>
          )}
        </div>

        {/* ---- BANNER IMAGE ---- */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Banner Image
          </label>
          <input
            type="file"
            name="bannerImage"
            accept="image/*"
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
          {fieldErrors.bannerImage && (
            <p className="text-red-500 text-sm">{fieldErrors.bannerImage}</p>
          )}
        </div>

        {/* ---- DATE & TIME ---- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            min={new Date().toISOString().split("T")[0]}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors.date && (
            <p className="text-red-500 text-sm">{fieldErrors.date}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
        </div>

        {/* ---- BOOKING DEADLINE ---- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Booking Deadline
          </label>
          <input
            type="date"
            name="bookingDeadline"
            value={formData.bookingDeadline}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
          {fieldErrors.bookingDeadline && (
            <p className="text-red-500 text-sm">
              {fieldErrors.bookingDeadline}
            </p>
          )}
        </div>

        {/* ---- VENUE DETAILS ---- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Venue Name *
          </label>
          <input
            type="text"
            name="venueName"
            placeholder="e.g. Royal Arena"
            value={formData.venueName}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors["venue.name"] && (
            <p className="text-red-500 text-sm">{fieldErrors["venue.name"]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            name="city"
            placeholder="e.g. New York"
            value={formData.city}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors["venue.city"] && (
            <p className="text-red-500 text-sm">{fieldErrors["venue.city"]}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <textarea
            name="address"
            rows="2"
            placeholder="Full venue address"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors["venue.address"] && (
            <p className="text-red-500 text-sm">
              {fieldErrors["venue.address"]}
            </p>
          )}
        </div>

        {/* ---- TICKETS & PRICE ---- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price ($) *
          </label>
          <input
            type="number"
            name="price"
            placeholder="0.00"
            min="0"
            value={formData.price}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors.price && (
            <p className="text-red-500 text-sm">{fieldErrors.price}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Tickets *
          </label>
          <input
            type="number"
            name="totalTickets"
            placeholder="e.g. 500"
            min="1"
            value={formData.totalTickets}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors.totalTickets && (
            <p className="text-red-500 text-sm">{fieldErrors.totalTickets}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Tickets *
          </label>
          <input
            type="number"
            name="availableTickets"
            placeholder="e.g. 500"
            min="0"
            value={formData.availableTickets}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors.availableTickets && (
            <p className="text-red-500 text-sm font-medium">
              {fieldErrors.availableTickets}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Tickets Per User
          </label>
          <input
            type="number"
            name="maxTicketsPerUser"
            placeholder="5"
            value={formData.maxTicketsPerUser}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* ---- REFUND POLICY & STATUS ---- */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Refund Policy
          </label>
          <textarea
            name="refundPolicy"
            rows="2"
            placeholder="Refund Policy details"
            value={formData.refundPolicy}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* ---- TAGS ---- */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            name="tags"
            placeholder="Comma-separated (e.g. music, live, rock)"
            value={formData.tags}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* ---- ARTISTS ---- */}
        <div className="md:col-span-2">
          <label className="block font-medium text-gray-700 mb-1">
            Artists
          </label>
          {formData.artists.map((artist, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Artist name"
                value={artist.name}
                onChange={(e) => updateArtist(idx, "name", e.target.value)}
                className="flex-1 p-2 border rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeArtist(idx)}
                className="text-red-500 hover:text-red-700 font-bold px-2"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addArtist}
            className="text-sm text-[#34908B] hover:underline font-medium"
          >
            + Add Artist
          </button>
        </div>

        {/* ---- SUBMIT BUTTON ---- */}
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-2 bg-[#34908B] text-white py-3 rounded-lg font-semibold hover:bg-[#2b7873] disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating Show..." : "Create Show"}
        </button>
      </form>
    </div>
  );
}