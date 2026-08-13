import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../store/AuthContext";

export default function UpgradeToOrganizer() {
  const { API } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    organizationName: "",
    address: "",
    website: "",
    phone: "",
    description: "",
    govIDType: "Citizenship",
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

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  // References to safely clear native HTML file inputs
  const profileInputRef = useRef(null);
  const govIDInputRef = useRef(null);

  // Handle text input changes & clear field error dynamically
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Handle file uploads & set live blob previews
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];

    if (file) {
      if (previews[name]) {
        URL.revokeObjectURL(previews[name]);
      }

      setFiles((prev) => ({ ...prev, [name]: file }));
      setPreviews((prev) => ({ ...prev, [name]: URL.createObjectURL(file) }));

      if (fieldErrors[name]) {
        setFieldErrors((prev) => {
          const updated = { ...prev };
          delete updated[name];
          return updated;
        });
      }
    }
  };

  // Clear selected image and revoke object URL
  const handleClearFile = (fieldName) => {
    if (previews[fieldName]) {
      URL.revokeObjectURL(previews[fieldName]);
    }

    setFiles((prev) => ({ ...prev, [fieldName]: null }));
    setPreviews((prev) => ({ ...prev, [fieldName]: null }));

    if (fieldName === "profileImage" && profileInputRef.current) {
      profileInputRef.current.value = "";
    }
    if (fieldName === "govIDImage" && govIDInputRef.current) {
      govIDInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    setFieldErrors({});

    const submitData = new FormData();

    Object.keys(formData).forEach((key) => {
      submitData.append(key, formData[key]);
    });

    if (files.profileImage) {
      submitData.append("profileImage", files.profileImage);
    }
    if (files.govIDImage) {
      submitData.append("govIDImage", files.govIDImage);
    }

    try {
      const res = await fetch(`${API}/api/users/upgrade-to-organizer`, {
        method: "PUT",
        credentials: "include",
        body: submitData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Parse array of error objects: [{ field: 'x', message: 'y' }] -> { x: 'y' }
        if (Array.isArray(data.errors)) {
          const formattedErrors = {};
          data.errors.forEach((err) => {
            if (err.field && err.message) {
              formattedErrors[err.field] = err.message;
            }
          });
          setFieldErrors(formattedErrors);
        } else if (data.errors && typeof data.errors === "object") {
          setFieldErrors(data.errors);
        }

        throw new Error(data.message || "Upgrade request failed.");
      }

      setMessage({
        type: "success",
        text: "Application submitted successfully! Your account status is pending verification.",
      });
      navigate("/");
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
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl">
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
          {/* Organization Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white border ${
                  fieldErrors.organizationName ? "border-rose-500" : "border-transparent"
                }`}
              />
              {fieldErrors.organizationName && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {fieldErrors.organizationName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Business Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white border ${
                  fieldErrors.phone ? "border-rose-500" : "border-transparent"
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {fieldErrors.phone}
                </p>
              )}
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
                value={formData.address}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white border ${
                  fieldErrors.address ? "border-rose-500" : "border-transparent"
                }`}
              />
              {fieldErrors.address && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {fieldErrors.address}
                </p>
              )}
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
                className={`w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white border ${
                  fieldErrors.website ? "border-rose-500" : "border-transparent"
                }`}
              />
              {fieldErrors.website && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {fieldErrors.website}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
              Organization Description *
            </label>
            <textarea
              name="description"
              rows="3"
              placeholder="Brief description about your events or company..."
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white resize-none border ${
                fieldErrors.description ? "border-rose-500" : "border-transparent"
              }`}
            ></textarea>
            {fieldErrors.description && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <hr className="border-t border-[#85d3c6] my-2" />

          {/* Identity & Government Verification */}
          <h3 className="text-lg font-bold text-[#0f3d3a]">Identity Verification</h3>

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
                <option value="Company Registration">Company Registration</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Govt ID / Registration Number *
              </label>
              <input
                type="text"
                name="govIDNumber"
                placeholder="e.g. 06-12-34567"
                value={formData.govIDNumber}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg outline-none text-gray-800 bg-white border ${
                  fieldErrors.govIDNumber ? "border-rose-500" : "border-transparent"
                }`}
              />
              {fieldErrors.govIDNumber && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {fieldErrors.govIDNumber}
                </p>
              )}
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Image Field */}
            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Profile / Logo Image
              </label>
              <input
                ref={profileInputRef}
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#34908B] file:text-white hover:file:bg-[#2f7f7a] cursor-pointer"
              />
              {fieldErrors.profileImage && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {fieldErrors.profileImage}
                </p>
              )}

              {previews.profileImage && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={previews.profileImage}
                    alt="Profile Preview"
                    className="w-20 h-20 object-cover rounded-full border-2 border-[#34908B] shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleClearFile("profileImage")}
                    className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow hover:bg-rose-700 transition"
                    title="Remove Image"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Gov ID Image Field */}
            <div>
              <label className="block text-sm font-semibold text-[#0f3d3a] mb-1">
                Govt ID Document Image *
              </label>
              <input
                ref={govIDInputRef}
                type="file"
                name="govIDImage"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#34908B] file:text-white hover:file:bg-[#2f7f7a] cursor-pointer"
              />
              {fieldErrors.govIDImage && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {fieldErrors.govIDImage}
                </p>
              )}

              {previews.govIDImage && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={previews.govIDImage}
                    alt="Gov ID Preview"
                    className="w-28 h-20 object-cover rounded-lg border-2 border-[#34908B] shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleClearFile("govIDImage")}
                    className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow hover:bg-rose-700 transition"
                    title="Remove Image"
                  >
                    ✕
                  </button>
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