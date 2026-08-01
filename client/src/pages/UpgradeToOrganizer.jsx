import { useState } from "react";
import { useNavigate } from "react-router";

export default function UpgradeToOrganizer() {
  const [formData, setFormData] = useState({
    organizationName: "",
    address: "",
    website: "",
    phone: "",
    description: "",
    govIDType: "Citizenship", // Default option
    govIDNumber: "",
  });

  const [files, setFiles] = useState({
    profileImage: null,
    govIDImage: null,
  });

  const [previews, setPreviews] = useState({
    profileImage: null,
    govIDImage: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API || "http://localhost:5000";

  // Handle standard text input updates
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file uploads & live image preview creation
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];

    if (file) {
      setFiles((prev) => ({ ...prev, [name]: file }));

      // Generate object URL for fast previewing
      const previewUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [name]: previewUrl }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Multi-part Form Data required for Multer upload support
    const submitData = new FormData();

    // 1. Append text fields
    Object.keys(formData).forEach((key) => {
      submitData.append(key, formData[key]);
    });

    // 2. Append files with correct schema names
    if (files.profileImage) {
      submitData.append("profileImage", files.profileImage);
    }
    if (files.govIDImage) {
      submitData.append("govIDImage", files.govIDImage);
    }

    try {
      // Fetch token stored after user authentication
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/api/users/upgrade-to-organizer`, {
        method: "PUT",
        headers: {
          // Do NOT set Content-Type header when using FormData; 
          // browser handles multipart/form-data boundaries automatically.
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: submitData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Upgrade request failed.");
      }

      setMessage({
        type: "success",
        text: "Application submitted successfully! Your account status is pending verification.",
      });
      navigate("/"); // Redirect to home or dashboard after successful submission

    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF4AF] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl bg-[#A5E9DD] p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-extrabold text-[#0f3d3a] text-center mb-2">
          Become an Organizer
        </h2>
        <p className="text-[#1a5854] text-center mb-6 text-sm">
          Fill out the business details below to verify your account and host events.
        </p>

        {message.text && (
          <div
            className={`p-4 mb-6 rounded-lg text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section: Organization Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                name="organizationName"
                required
                placeholder="Acme Events Co."
                value={formData.organizationName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Business Phone *
              </label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="+1 234 567 890"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Address / Location *
              </label>
              <input
                type="text"
                name="address"
                required
                placeholder="123 Main St, New York, NY"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Website URL
              </label>
              <input
                type="url"
                name="website"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
              Organization Description
            </label>
            <textarea
              name="description"
              rows="3"
              placeholder="Brief description about your events or company..."
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white resize-none"
            ></textarea>
          </div>

          <hr className="border-t border-[#85d3c6] my-2" />

          {/* Section: Identity & Government Verification */}
          <h3 className="text-lg font-bold text-[#0f3d3a]">
            Identity Verification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Govt ID Type *
              </label>
              <select
                name="govIDType"
                value={formData.govIDType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white"
              >
                <option value="Citizenship">Citizenship</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="National ID">National ID</option>
                <option value="Company Registration">
                  Company Registration
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Govt ID / Registration Number *
              </label>
              <input
                type="text"
                name="govIDNumber"
                required
                placeholder="e.g. 06-12-34567"
                value={formData.govIDNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white"
              />
            </div>
          </div>

          {/* Section: File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Image Field */}
            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Profile / Logo Image
              </label>
              <input
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#34908B] file:text-white hover:file:bg-[#2f7f7a] cursor-pointer"
              />
              {previews.profileImage && (
                <div className="mt-2">
                  <img
                    src={previews.profileImage}
                    alt="Profile Preview"
                    className="w-16 h-16 object-cover rounded-full border-2 border-[#34908B]"
                  />
                </div>
              )}
            </div>

            {/* Gov ID Image Field */}
            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Govt ID Document Image *
              </label>
              <input
                type="file"
                name="govIDImage"
                accept="image/*"
                required
                onChange={handleFileChange}
                className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#34908B] file:text-white hover:file:bg-[#2f7f7a] cursor-pointer"
              />
              {previews.govIDImage && (
                <div className="mt-2">
                  <img
                    src={previews.govIDImage}
                    alt="Gov ID Preview"
                    className="w-24 h-16 object-cover rounded-lg border-2 border-[#34908B]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#34908B] text-white py-3 rounded-lg font-bold text-base hover:bg-[#2f7f7a] transition shadow-md disabled:opacity-50 mt-4"
          >
            {loading ? "Submitting Application..." : "Submit Upgrade Request"}
          </button>
        </form>
      </div>
    </div>
  );
}