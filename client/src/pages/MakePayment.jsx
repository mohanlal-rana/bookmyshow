import { useState, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../store/AuthContext";

export default function MakePayment() {
  const { API } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const { show, quantity = 1, ticketType = "standard" } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Safely calculate unit price matching backend logic (supports standard & student)
  const unitPrice = useMemo(() => {
    if (!show) return 0;

    const basePrice = show.price || 0;
    const normalizedType = ticketType.toString().toLowerCase();

    // 1. Explicitly configured price in show.prices object
    if (show.prices?.[normalizedType] !== undefined) {
      return show.prices[normalizedType];
    }

    // 2. Dynamic fallback (Student gets 20% off)
    return normalizedType === "student" ? Math.round(basePrice * 0.8) : basePrice;
  }, [show, ticketType]);

  const totalAmount = unitPrice * quantity;

  if (!show) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md border border-[#8ce0d2]">
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Event Selected</h2>
          <p className="text-gray-600 mb-6">Please select an event before proceeding to payment.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#34908B] text-white px-5 py-2.5 rounded-lg hover:bg-[#2b7873] transition font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Real eSewa Flow: Create pending booking -> Fetch HMAC signature -> Auto Submit POST form
  const handleEsewaPayment = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Create Pending Booking
      const createRes = await fetch(`${API}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          showId: show._id,
          ticketType: ticketType.toLowerCase(), // Ensures lowercase 'standard' or 'student'
          totalTickets: quantity,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.message || "Failed to create booking.");

      const bookingId = createData.booking._id;

      // 2. Request eSewa Gateway Signature Data
      const initRes = await fetch(`${API}/api/bookings/esewa-initiate/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.message || "eSewa initialization failed.");
      
      // 3. Construct and auto-submit form to eSewa portal
      const { esewaFormData } = initData;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = esewaFormData.action_url;

      Object.keys(esewaFormData).forEach((key) => {
        if (key !== "action_url") {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = esewaFormData[key];
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setErrorMsg(err.message || "Payment initiation failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF4AF] py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-[#34908B] mb-6 text-center">
          Checkout & Payment
        </h1>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-[#8ce0d2] space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">Order Summary</h2>

            <div className="flex items-center gap-4">
              {show.bannerImage ? (
                <img
                  src={show.bannerImage.startsWith("http") ? show.bannerImage : `${API}/${show.bannerImage}`}
                  alt={show.name}
                  className="w-24 h-20 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-24 h-20 bg-[#34908B] text-white flex items-center justify-center font-bold text-xs p-1 rounded-lg text-center">
                  {show.name}
                </div>
              )}

              <div>
                <h3 className="font-bold text-lg text-gray-800">{show.name}</h3>
                <p className="text-sm text-gray-500">🎭 {show.genre}</p>
                <p className="text-sm text-gray-500">📍 {show.venue?.name}, {show.venue?.city}</p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Ticket Type:</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {ticketType}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Price per Ticket:</span>
                <span className="font-semibold">Rs. {unitPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-semibold">{quantity} Ticket(s)</span>
              </div>
              <hr />
              <div className="flex justify-between text-base font-bold text-gray-900 pt-1">
                <span>Total Amount:</span>
                <span className="text-[#34908B] text-xl">Rs. {totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-[#8ce0d2] flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3">Payment Method</h2>
              <label className="border-2 border-[#60BB46] bg-[#60BB46]/10 p-4 rounded-xl flex items-center gap-3 cursor-pointer">
                <input type="radio" name="payment" defaultChecked className="accent-[#60BB46] w-4 h-4" />
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-gray-800">eSewa ePay</span>
                  <span className="bg-[#60BB46] text-white text-xs font-bold px-2 py-0.5 rounded">UAT</span>
                </div>
              </label>
            </div>

            <button
              onClick={handleEsewaPayment}
              disabled={loading}
              className="w-full bg-[#60BB46] hover:bg-[#52a33c] text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50"
            >
              {loading ? "Redirecting to eSewa..." : `Pay Rs. ${totalAmount} via eSewa`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}