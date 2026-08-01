import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MakePayment() {
  const API = import.meta.env.VITE_API;
  const navigate = useNavigate();
  const location = useLocation();

  const { show, quantity = 1, ticketType } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [esewaId, setEsewaId] = useState("9800000000");
  const [pin, setPin] = useState("1234");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!show) {
    return (
      <div className="min-h-screen bg-[#FDF4AF] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md border border-[#8ce0d2]">
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Event Selected</h2>
          <p className="text-gray-600 mb-6">
            Please select an event before proceeding to payment.
          </p>
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

  // Retrieve price from selected ticketType or fallback to default
  const ticketInfo = show.ticketTypes?.find((t) => t.name === ticketType);
  const unitPrice = ticketInfo?.price || show.price || 0;
  const totalAmount = unitPrice * quantity;

  // Open dummy eSewa popup
  const handleInitiatePayment = () => {
    setErrorMsg("");
    setShowModal(true);
  };

  // 2-Step Payment execution matched to backend controllers
  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Step 1: Create pending booking
      const createRes = await fetch(`${API}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          showId: show._id,
          ticketType: ticketType || show.ticketTypes?.[0]?.name || "Standard",
          totalTickets: quantity,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData.message || "Failed to create booking.");
      }

      const bookingId = createData.booking._id;

      // Step 2: Trigger mock payment confirmation
      const payRes = await fetch(`${API}/api/bookings/mock-pay/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const payData = await payRes.json();

      if (!payRes.ok) {
        throw new Error(payData.message || "Payment execution failed.");
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        navigate("/my-bookings");
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF4AF] py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-[#34908B] mb-6 text-center">
          Checkout & Payment
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Column */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-[#8ce0d2] space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">
              Order Summary
            </h2>

            <div className="flex items-center gap-4">
              {show.bannerImage ? (
                <img
                  src={
                    show.bannerImage.startsWith("http")
                      ? show.bannerImage
                      : `${API}/${show.bannerImage}`
                  }
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
                <p className="text-sm text-gray-500">
                  📍 {show.venue?.name}, {show.venue?.city}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Ticket Type:</span>
                <span className="font-semibold text-gray-900">{ticketType || "Standard"}</span>
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

          {/* Payment Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-[#8ce0d2] flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3">
                Payment Method
              </h2>

              <label className="border-2 border-[#60BB46] bg-[#60BB46]/10 p-4 rounded-xl flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  defaultChecked
                  className="accent-[#60BB46] w-4 h-4"
                />
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-gray-800">eSewa Wallet</span>
                  <span className="bg-[#60BB46] text-white text-xs font-bold px-2 py-0.5 rounded">
                    TEST MODE
                  </span>
                </div>
              </label>
            </div>

            <button
              onClick={handleInitiatePayment}
              className="w-full bg-[#60BB46] hover:bg-[#52a33c] text-white font-bold py-3.5 rounded-xl transition shadow-md"
            >
              Pay Rs. {totalAmount} via eSewa
            </button>
          </div>
        </div>
      </div>

      {/* --- ESEWA MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border">
            <div className="bg-[#60BB46] text-white p-4 flex justify-between items-center">
              <span className="font-black text-xl tracking-wide">eSewa Sandbox</span>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {paymentSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 bg-green-100 text-[#60BB46] rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Payment Successful!
                  </h3>
                  <p className="text-sm text-gray-600">
                    QR tickets generated. Redirecting to your bookings...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSimulatePayment} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-600 border border-red-200 text-xs rounded-lg">
                      {errorMsg}
                    </div>
                  )}

                  <div className="bg-gray-50 p-3 rounded-lg border text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Payable:</span>
                      <span className="font-bold text-[#60BB46]">Rs. {totalAmount}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      eSewa ID (Mobile)
                    </label>
                    <input
                      type="text"
                      value={esewaId}
                      onChange={(e) => setEsewaId(e.target.value)}
                      className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-[#60BB46]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      MPIN
                    </label>
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-[#60BB46]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#60BB46] hover:bg-[#52a33c] text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? "Confirming Booking & QR..." : "Confirm & Pay"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}