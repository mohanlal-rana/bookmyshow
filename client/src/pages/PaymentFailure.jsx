import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawQuery = window.location.search;
  let failureDetail = null;
  const encodedData = searchParams.get("data");
  if (encodedData) {
    try {
      const base64 = encodedData.replace(/ /g, "+");
      const jsonStr = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      const decoded = JSON.parse(jsonStr);
      failureDetail = {
        status: decoded.status,
        transactionUuid: decoded.transaction_uuid,
        message: decoded.message,
        raw: decoded,
      };
    } catch {
      failureDetail = { raw: encodedData };
    }
  }

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

        {failureDetail && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left text-xs text-gray-700 space-y-1">
            {failureDetail.status && (
              <p>
                <span className="font-bold">Status:</span> {failureDetail.status}
              </p>
            )}
            {failureDetail.transactionUuid && (
              <p className="break-all">
                <span className="font-bold">Transaction UUID:</span>{" "}
                {failureDetail.transactionUuid}
              </p>
            )}
            {failureDetail.message && (
              <p>
                <span className="font-bold">Reason:</span> {failureDetail.message}
              </p>
            )}
            {failureDetail.raw && !failureDetail.status && (
              <p className="break-all">{failureDetail.raw}</p>
            )}
          </div>
        )}

        {!failureDetail && rawQuery && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left text-xs text-gray-700 break-all">
            <p className="font-bold mb-1">Raw eSewa redirect URL:</p>
            <p>{rawQuery}</p>
          </div>
        )}

        {!failureDetail && !rawQuery && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left text-xs text-gray-700">
            eSewa sent <span className="font-bold">no query parameters</span> on
            this failure redirect. The gateway rejected the payment before
            giving any details.
          </div>
        )}

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