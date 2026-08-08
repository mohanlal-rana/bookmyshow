import { useNavigate } from "react-router-dom";

export default function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDF4AF] flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#8ce0d2] text-center max-w-md w-full space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
          ✕
        </div>
        <h2 className="text-xl font-bold text-gray-800">Payment Unsuccessful</h2>
        <p className="text-sm text-gray-600">
          Your transaction with eSewa was cancelled or encountered an error.
        </p>

        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-[#34908B] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2b7873]"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}