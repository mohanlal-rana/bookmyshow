import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../store/AuthContext";

export default function AddEvent() {
  const { API } = useContext(AuthContext);
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
    status: "published",
    bookingDeadline: "",
    tags: "",
    artists: [],
  });

  const [bannerPreview, setBannerPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const bannerInputRef = useRef(null);

  // Clear specific field error dynamically on user interaction
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  };

  // ---- Banner Image Handling ----
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
      }
      setFormData((prev) => ({ ...prev, bannerImage: file }));
      setBannerPreview(URL.createObjectURL(file));
      clearFieldError("bannerImage");
    }
  };

  const handleClearBanner = () => {
    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
    }
    setFormData((prev) => ({ ...prev, bannerImage: null }));
    setBannerPreview(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

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
    const { name, value, type, checked } = e.target;
    clearFieldError(name);

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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

      // Venue JSON mapping
      form.append(
        "venue",
        JSON.stringify({
          name: formData.venueName,
          city: formData.city,
          address: formData.address,
        })
      );

      // Numbers
      form.append("totalTickets", Number(formData.totalTickets));
      form.append("availableTickets", Number(formData.totalTickets));
      form.append("price", Number(formData.price));
      form.append("maxTicketsPerUser", Number(formData.maxTicketsPerUser));

      // Metadata
      form.append("status", formData.status);

      if (formData.bookingDeadline) {
        form.append("bookingDeadline", formData.bookingDeadline);
      }

      // Tags Array
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

      const data = await res.json();

      if (!res.ok) {
        if (Array.isArray(data.errors)) {
          const errorsObj = {};
          data.errors.forEach((err) => {
            if (err.field) {
              errorsObj[err.field] = err.message;
            }
          });
          setFieldErrors(errorsObj);
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
        <div className="bg-rose-100 text-rose-700 p-4 rounded-lg mb-6 text-sm font-medium border border-rose-200">
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
            className={`w-full p-3 border rounded-lg outline-none ${
              fieldErrors.name ? "border-rose-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.name && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors.name}
            </p>
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
            className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white"
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
            className={`w-full p-3 border rounded-lg outline-none resize-none ${
              fieldErrors.description ? "border-rose-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.description && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors.description}
            </p>
          )}
        </div>

        {/* ---- BANNER IMAGE & PREVIEW ---- */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Banner Image
          </label>
          <input
            ref={bannerInputRef}
            type="file"
            name="bannerImage"
            accept="image/*"
            onChange={handleBannerChange}
            className="w-full text-xs text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#34908B] file:text-white hover:file:bg-[#2b7873] cursor-pointer border border-gray-300 rounded-lg"
          />
          {fieldErrors.bannerImage && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors.bannerImage}
            </p>
          )}

          {bannerPreview && (
            <div className="mt-4 relative inline-block">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Banner Preview:
              </p>
              <img
                src={bannerPreview}
                alt="Banner Preview"
                className="w-full max-w-md h-48 object-cover rounded-xl border-2 border-[#34908B] shadow-sm"
              />
              <button
                type="button"
                onClick={handleClearBanner}
                className="absolute top-8 right-2 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-rose-700 transition"
                title="Remove Banner"
              >
                ✕
              </button>
            </div>
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
            className={`w-full p-3 border rounded-lg outline-none ${
              fieldErrors.date ? "border-rose-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.date && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors.date}
            </p>
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
              className={`w-full p-3 border rounded-lg outline-none ${
                fieldErrors.startTime ? "border-rose-500" : "border-gray-300"
              }`}
            />
            {fieldErrors.startTime && (
              <p className="text-rose-500 text-xs mt-1 font-medium">
                {fieldErrors.startTime}
              </p>
            )}
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
              className={`w-full p-3 border rounded-lg outline-none ${
                fieldErrors.endTime ? "border-rose-500" : "border-gray-300"
              }`}
            />
            {fieldErrors.endTime && (
              <p className="text-rose-500 text-xs mt-1 font-medium">
                {fieldErrors.endTime}
              </p>
            )}
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
            className={`w-full p-3 border rounded-lg outline-none ${
              fieldErrors.bookingDeadline
                ? "border-rose-500"
                : "border-gray-300"
            }`}
          />
          {fieldErrors.bookingDeadline && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
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
            onChange={(e) => {
              handleChange(e);
              clearFieldError("venue.name");
            }}
            className={`w-full p-3 border rounded-lg outline-none ${
              fieldErrors["venue.name"] ? "border-rose-500" : "border-gray-300"
            }`}
          />
          {fieldErrors["venue.name"] && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors["venue.name"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            name="city"
            placeholder="e.g. Kathmandu"
            value={formData.city}
            onChange={(e) => {
              handleChange(e);
              clearFieldError("venue.city");
            }}
            className={`w-full p-3 border rounded-lg outline-none ${
              fieldErrors["venue.city"] ? "border-rose-500" : "border-gray-300"
            }`}
          />
          {fieldErrors["venue.city"] && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors["venue.city"]}
            </p>
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
            onChange={(e) => {
              handleChange(e);
              clearFieldError("venue.address");
            }}
            className={`w-full p-3 border rounded-lg outline-none resize-none ${
              fieldErrors["venue.address"]
                ? "border-rose-500"
                : "border-gray-300"
            }`}
          />
          {fieldErrors["venue.address"] && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors["venue.address"]}
            </p>
          )}
        </div>

        {/* ---- TICKETS & PRICE ---- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (Rs) *
          </label>
          <input
            type="number"
            name="price"
            placeholder="0.00"
            min="0"
            value={formData.price}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg outline-none ${
              fieldErrors.price ? "border-rose-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.price && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors.price}
            </p>
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
            className={`w-full p-3 border rounded-lg outline-none ${
              fieldErrors.totalTickets ? "border-rose-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.totalTickets && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors.totalTickets}
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
            className={`w-full p-3 border rounded-lg outline-none ${
              fieldErrors.maxTicketsPerUser
                ? "border-rose-500"
                : "border-gray-300"
            }`}
          />
          {fieldErrors.maxTicketsPerUser && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors.maxTicketsPerUser}
            </p>
          )}
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
            className="w-full p-3 border border-gray-300 rounded-lg outline-none"
          />
          {fieldErrors.tags && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors.tags}
            </p>
          )}
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
                className="flex-1 p-2 border border-gray-300 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={() => removeArtist(idx)}
                className="text-rose-500 hover:text-rose-700 font-bold px-2"
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
          {fieldErrors.artists && (
            <p className="text-rose-500 text-xs mt-1 font-medium">
              {fieldErrors.artists}
            </p>
          )}
        </div>

        {/* ---- SUBMIT BUTTON ---- */}
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-2 bg-[#34908B] text-white py-3 rounded-lg font-semibold hover:bg-[#2b7873] disabled:opacity-50 transition-colors shadow"
        >
          {loading ? "Creating Show..." : "Create Show"}
        </button>
      </form>
    </div>
  );
}