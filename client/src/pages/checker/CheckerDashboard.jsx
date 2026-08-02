import React from "react";

export default function CheckerDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#34908B]">
        Checker Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#A5E9DD] p-4 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold text-[#1a4a47]">Today's Scans</h2>
          <p className="text-3xl font-black text-[#266965] mt-2">128</p>
          <span className="text-xs text-[#266965]">Successfully checked in</span>
        </div>

        <div className="bg-[#A5E9DD] p-4 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold text-[#1a4a47]">Pending Entry</h2>
          <p className="text-3xl font-black text-[#266965] mt-2">42</p>
          <span className="text-xs text-[#266965]">Paid tickets remaining</span>
        </div>

        <div className="bg-[#A5E9DD] p-4 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold text-[#1a4a47]">Invalid / Flags</h2>
          <p className="text-3xl font-black text-[#266965] mt-2">3</p>
          <span className="text-xs text-[#266965]">Rejected / Repeated scans</span>
        </div>
      </div>
    </div>
  );
}