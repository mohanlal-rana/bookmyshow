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
    bannerImage: null,
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
    status: "published",
    bookingDeadline: "",
    tags: "",
    artists: [],
  });

  const [isVerified, setIsVerified] = useState(false);
  const [currentBannerUrl, setCurrentBannerUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const fieldKeyMap = {
    venueName: "venue.name",
    city: "venue.city",
    address: "venue.address",
  };

  const clearFieldError = (errorKey) => {
    setFieldErrors((prev) => {
      if (!prev[errorKey]) return prev;
      const updated = { ...prev };
      delete updated[errorKey];
      return updated;
    });
  };

  const getFieldError = (fieldName) => fieldErrors[fieldName];

  const inputClass = (fieldName, isDisabled = false) =>
    `w-full p-3 border rounded-lg transition-colors focus:outline-none ${
      isDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
    } ${
      getFieldError(fieldName)
        ? "border-red-500 focus:border-red-500 ring-1 ring-red-500"
        : "border-gray-300 focus:border-[#34908B]"
    }`;

  // Helper check to see if the event date + end time has passed
  const isEventEnded = () => {
    if (!formData.date || !formData.endTime) return false;
    const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);
    return new Date() >= endDateTime;
  };

  // ---- Artist handlers ----
  const addArtist = () => {
    setFormData((prev) => ({
      ...prev,
      artists: [...prev.artists, { name: "", image: "" }],
    }));
    clearFieldError("artists");
  };

  const removeArtist = (index) => {
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.filter((_, i) => i !== index),
    }));
    clearFieldError(`artists[${index}].name`);
  };

  const updateArtist = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.artists];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, artists: updated };
    });
    clearFieldError(`artists[${index}].${field}`);
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

        setIsVerified(show.isVerified || false);

        setFormData({
          name: show.name || "",
          description: show.description || "",
          genre: show.genre || "Concert",
          bannerImage: null,
          date: show.date ? new Date(show.date).toISOString().split("T")[0] : "",
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
          artists:
            show.artists?.map((a) => ({
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

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    const targetErrorKey = fieldKeyMap[name] || name;
    clearFieldError(targetErrorKey);

    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const form = new FormData();

      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("genre", formData.genre);

      // Only append date and time fields if not verified
      if (!isVerified) {
        form.append("date", formData.date);
        form.append("startTime", formData.startTime);
        form.append("endTime", formData.endTime);
      }

      form.append(
        "venue",
        JSON.stringify({
          name: formData.venueName,
          city: formData.city,
          address: formData.address,
        })
      );

      form.append("price", Number(formData.price));
      form.append("totalTickets", Number(formData.totalTickets));
      form.append("availableTickets", Number(formData.availableTickets));
      form.append("maxTicketsPerUser", Number(formData.maxTicketsPerUser));

      form.append("refundPolicy", formData.refundPolicy || "");
      form.append("status", formData.status);

      if (formData.bookingDeadline) {
        form.append("bookingDeadline", formData.bookingDeadline);
      }

      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      form.append("tags", JSON.stringify(tagsArray));
      form.append("artists", JSON.stringify(formData.artists));

      if (formData.bannerImage instanceof File) {
        form.append("bannerImage", formData.bannerImage);
      }

      const res = await fetch(`${API}/api/shows/organizer/shows/${id}`, {
        method: "PUT",
        credentials: "include",
        body: form,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (Array.isArray(data.errors)) {
          const errors = {};
          data.errors.forEach((err) => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
        } else {
          setError(data.message || "Failed to update event.");
        }
        return;
      }

      alert("Show updated successfully!");
      navigate(`/organizer/events/${id}`);
    } catch (err) {
      console.error(err);
      setError("Network error or server unreachable.");
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

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-3xl font-bold text-[#34908B] mb-6">Edit Event</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 whitespace-pre-line border border-red-200">
          {error}
        </div>
      )}

      {isVerified && (
        <div className="bg-amber-50 text-amber-800 p-3 rounded mb-4 text-sm border border-amber-200">
          <strong>Note:</strong> This event has been verified by an admin. Event date and time can no longer be edited.
        </div>
      )}

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
        {/* SHOW NAME */}
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
            className={inputClass("name")}
            required
          />
          {getFieldError("name") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("name")}</p>
          )}
        </div>

        {/* GENRE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genre *
          </label>
          <select
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            className={inputClass("genre")}
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
          {getFieldError("genre") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("genre")}</p>
          )}
        </div>

        {/* DESCRIPTION */}
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
            className={inputClass("description")}
            required
          />
          {getFieldError("description") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("description")}</p>
          )}
        </div>

        {/* BANNER IMAGE */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Replace Banner Image (Optional)
          </label>
          <input
            type="file"
            name="bannerImage"
            accept="image/*"
            onChange={handleChange}
            className={inputClass("bannerImage")}
          />
          {getFieldError("bannerImage") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("bannerImage")}</p>
          )}
        </div>

        {/* DATE & TIME (Disabled if isVerified) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date * {isVerified && "(Locked)"}
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            disabled={isVerified}
            className={inputClass("date", isVerified)}
            required
          />
          {getFieldError("date") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("date")}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time * {isVerified && "(Locked)"}
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              disabled={isVerified}
              className={inputClass("startTime", isVerified)}
              required
            />
            {getFieldError("startTime") && (
              <p className="text-red-500 text-sm mt-1">{getFieldError("startTime")}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time * {isVerified && "(Locked)"}
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              disabled={isVerified}
              className={inputClass("endTime", isVerified)}
              required
            />
            {getFieldError("endTime") && (
              <p className="text-red-500 text-sm mt-1">{getFieldError("endTime")}</p>
            )}
          </div>
        </div>

        {/* BOOKING DEADLINE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Booking Deadline
          </label>
          <input
            type="date"
            name="bookingDeadline"
            value={formData.bookingDeadline}
            onChange={handleChange}
            className={inputClass("bookingDeadline")}
          />
          {getFieldError("bookingDeadline") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("bookingDeadline")}</p>
          )}
        </div>

        {/* VENUE DETAILS */}
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
            className={inputClass("venue.name")}
            required
          />
          {getFieldError("venue.name") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("venue.name")}</p>
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
            className={inputClass("venue.city")}
            required
          />
          {getFieldError("venue.city") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("venue.city")}</p>
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
            className={inputClass("venue.address")}
            required
          />
          {getFieldError("venue.address") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("venue.address")}</p>
          )}
        </div>

        {/* TICKETS & PRICE */}
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
            className={inputClass("price")}
            required
          />
          {getFieldError("price") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("price")}</p>
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
            className={inputClass("totalTickets")}
            required
          />
          {getFieldError("totalTickets") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("totalTickets")}</p>
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
            className={inputClass("maxTicketsPerUser")}
          />
          {getFieldError("maxTicketsPerUser") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("maxTicketsPerUser")}</p>
          )}
        </div>

        {/* STATUS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={inputClass("status")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            {(isEventEnded() || formData.status === "completed") && (
              <option value="completed">Completed</option>
            )}
          </select>
          {getFieldError("status") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("status")}</p>
          )}
        </div>

        {/* TAGS */}
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
            className={inputClass("tags")}
          />
          {getFieldError("tags") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("tags")}</p>
          )}
        </div>

        {/* ARTISTS */}
        <div className="md:col-span-2">
          <label className="block font-medium text-gray-700 mb-1">Artists</label>
          {formData.artists.map((artist, idx) => (
            <div key={idx} className="flex flex-col mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Artist name"
                  value={artist.name}
                  onChange={(e) => updateArtist(idx, "name", e.target.value)}
                  className={inputClass(`artists[${idx}].name`)}
                />
                <button
                  type="button"
                  onClick={() => removeArtist(idx)}
                  className="text-red-500 hover:text-red-700 font-bold px-2"
                >
                  ✕
                </button>
              </div>
              {getFieldError(`artists[${idx}].name`) && (
                <p className="text-red-500 text-sm mt-1">
                  {getFieldError(`artists[${idx}].name`)}
                </p>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addArtist}
            className="text-sm text-[#34908B] hover:underline font-medium"
          >
            + Add Artist
          </button>
          {getFieldError("artists") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("artists")}</p>
          )}
        </div>

        {/* SUBMIT BUTTON */}
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