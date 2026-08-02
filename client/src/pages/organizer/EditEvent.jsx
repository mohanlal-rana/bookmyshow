import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../store/AuthContext";

export default function EditEvent() {
  const { API } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    genre: "Concert",
    bannerImage: null, // file for new upload
    date: "",
    startTime: "",
    endTime: "",
    venueName: "",
    city: "",
    address: "",
    price: "",
    totalTickets: "",
    availableTickets: "",
    maxTicketsPerUser: 5,
    refundPolicy: "",
    status: "published",
    bookingDeadline: "",
    tags: "", // stored as string during editing
    artists: [],
  });

  const [currentBannerUrl, setCurrentBannerUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  // ---- Fetch Event Data ----
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setFetching(true);
        setError("");

        const res = await fetch(`${API}/api/shows/organizer/shows/${id}`, {
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load show data.");
        }

        const show = data.show;

        setFormData({
          name: show.name || "",
          description: show.description || "",
          genre: show.genre || "Concert",
          bannerImage: null,
          date: show.date
            ? new Date(show.date).toISOString().split("T")[0]
            : "",
          startTime: show.startTime || "",
          endTime: show.endTime || "",
          venueName: show.venue?.name || "",
          city: show.venue?.city || "",
          address: show.venue?.address || "",
          price: show.price ?? "",
          totalTickets: show.totalTickets ?? "",
          availableTickets: show.availableTickets ?? "",
          maxTicketsPerUser: show.maxTicketsPerUser ?? 5,
          refundPolicy: show.refundPolicy || "",
          status: show.status || "published",
          bookingDeadline: show.bookingDeadline
            ? new Date(show.bookingDeadline).toISOString().split("T")[0]
            : "",
          tags: Array.isArray(show.tags) ? show.tags.join(", ") : "",
          artists: show.artists?.map((a) => ({
            name: a.name || "",
            image: a.image || "",
          })) || [],
        });

        setCurrentBannerUrl(show.bannerImage || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };

    fetchEvent();
  }, [API, id]);

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

  // ---- Submit Form ----
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setFieldErrors({});

      const form = new FormData();

      // Basic info
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("genre", formData.genre);
      form.append("date", formData.date);
      form.append("startTime", formData.startTime);
      form.append("endTime", formData.endTime);

      // Venue structure
      form.append(
        "venue",
        JSON.stringify({
          name: formData.venueName,
          city: formData.city,
          address: formData.address,
        })
      );

      // Numerical ticket properties
      form.append("price", Number(formData.price));
      form.append("totalTickets", Number(formData.totalTickets));
      form.append("availableTickets", Number(formData.availableTickets));
      form.append("maxTicketsPerUser", Number(formData.maxTicketsPerUser));

      // Policy & Metadata
      form.append("refundPolicy", formData.refundPolicy);
      form.append("status", formData.status);

      if (formData.bookingDeadline) {
        form.append("bookingDeadline", formData.bookingDeadline);
      }

      // Convert tags string to array
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      form.append("tags", JSON.stringify(tagsArray));

      // Artists array
      form.append("artists", JSON.stringify(formData.artists));

      // Banner Image file (if new file uploaded)
      if (formData.bannerImage instanceof File) {
        form.append("bannerImage", formData.bannerImage);
      }

      const res = await fetch(`${API}/api/shows/organizer/shows/${id}`, {
        method: "PUT",
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
          "Server returned an invalid response. Check backend logs for errors."
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
        throw new Error(data.message || "Failed to update event.");
      }

      alert("Show updated successfully!");
      navigate(`/organizer/events/${id}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-12 text-center text-lg font-semibold text-[#34908B]">
        Loading event data...
      </div>
    );
  }

  if (error && !fetching) {
    return (
      <div className="p-12 text-center text-red-600 font-semibold bg-red-50 rounded-xl max-w-2xl mx-auto mt-6 border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-3xl font-bold text-[#34908B] mb-6">Edit Event</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Current Banner Preview */}
      {currentBannerUrl && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Current Banner Image:</p>
          <img
            src={
              currentBannerUrl.startsWith("http")
                ? currentBannerUrl
                : `${API}/${currentBannerUrl}`
            }
            alt="Current Banner"
            className="w-full h-48 object-cover rounded-lg border shadow-sm"
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
        {/* ---- SHOW NAME ---- */}
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
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors.description && (
            <p className="text-red-500 text-sm">{fieldErrors.description}</p>
          )}
        </div>

        {/* ---- NEW BANNER IMAGE UPLOAD ---- */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Replace Banner Image (Optional)
          </label>
          <input
            type="file"
            name="bannerImage"
            accept="image/*"
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
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
        </div>

        {/* ---- VENUE DETAILS ---- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Venue Name *
          </label>
          <input
            type="text"
            name="venueName"
            placeholder="Venue Name"
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
            placeholder="City"
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
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {fieldErrors["venue.address"] && (
            <p className="text-red-500 text-sm">{fieldErrors["venue.address"]}</p>
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
            placeholder="Total Tickets"
            min="1"
            value={formData.totalTickets}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Tickets *
          </label>
          <input
            type="number"
            name="availableTickets"
            placeholder="Available Tickets"
            min="0"
            value={formData.availableTickets}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
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
            placeholder="Refund Policy"
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
            placeholder="Comma-separated (e.g. music, live, coldplay)"
            value={formData.tags}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* ---- ARTISTS ---- */}
        <div className="md:col-span-2">
          <label className="block font-medium text-gray-700 mb-1">Artists</label>
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

        {/* ---- SUBMIT ---- */}
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-2 bg-[#34908B] text-white py-3 rounded-lg font-semibold hover:bg-[#2b7873] disabled:opacity-50 transition-colors"
        >
          {loading ? "Updating Show..." : "Update Event"}
        </button>
      </form>
    </div>
  );
}