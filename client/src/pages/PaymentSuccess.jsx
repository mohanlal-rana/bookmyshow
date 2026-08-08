import { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../store/AuthContext";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { API } = useContext(AuthContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying payment with eSewa...");
  const [error, setError] = useState(false);

  useEffect(() => {
    const encodedData = searchParams.get("data");

    if (!encodedData) {
      setStatus("Invalid redirect data from eSewa.");
      setError(true);
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API}/api/bookings/esewa-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ data: encodedData }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Verification failed");

        setStatus("Payment verified! QR tickets generated.");
        setTimeout(() => navigate("/my-bookings"), 2000);
      } catch (err) {
        setStatus(err.message || "Payment verification failed.");
        setError(true);
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#FDF4AF] flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#8ce0d2] text-center max-w-md w-full space-y-4">
        {!error ? (
          <div className="w-16 h-16 bg-green-100 text-[#60BB46] rounded-full flex items-center justify-center text-3xl mx-auto font-bold animate-pulse">
            ✓
          </div>
        ) : (
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
            ✕
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-800">eSewa Payment Verification</h2>
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>{status}</p>

        {error && (
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-[#34908B] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#2b7873]"
          >
            Return to Home
          </button>
        )}
      </div>
    </div>
  );
}