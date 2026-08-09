import Show from "../models/showModel.js";
import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js"
import Payment from "../models/paymentModel.js"

export const organizerDashboard = async (req, res) => {
  try {
    const organizerId = req.user._id;

    // Fetch shows created by the organizer
    const shows = await Show.find({ organizerId }).sort({ createdAt: -1 });
    const showIds = shows.map((show) => show._id);

    // Fetch bookings for these shows
    const bookings = await Booking.find({ showId: { $in: showIds } })
      .populate("userId", "name email profileImage")
      .populate("showId", "name date startTime venue price")
      .sort({ createdAt: -1 });

    // Calculate Financials & Aggregates
    const confirmedBookings = bookings.filter((b) => b.paymentStatus === "paid");
    
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalTicketsSold = shows.reduce((sum, s) => sum + (s.soldTickets || 0), 0);
    const totalTicketsAvailable = shows.reduce((sum, s) => sum + (s.availableTickets || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRevenue,
          totalBookings: bookings.length,
          confirmedBookingsCount: confirmedBookings.length,
          totalTicketsSold,
          totalTicketsAvailable,
          activeShowsCount: shows.filter((s) => s.status === "published").length,
        },
        shows,
        bookings,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const adminDashboard = async (req, res) => {
  try {
    // 1. Fetch Aggregated Metrics
    const [
      totalUsers,
      totalOrganizers,
      pendingOrganizers,
      totalShows,
      activeShows,
      totalBookings,
      totalPayments,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "organizer" }),
      User.countDocuments({ role: "organizer", "organizer.isVerified": false }),
      Show.countDocuments(),
      Show.countDocuments({ status: "published" }),
      Booking.countDocuments({ bookingStatus: "confirmed" }),
      Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalRevenue = totalPayments[0]?.total || 0;

    // 2. Fetch Recent System Activity
    const recentUsers = await User.find()
      .select("name email role isActive isBlocked createdAt organizer")
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingOrganizersList = await User.find({
      role: "organizer",
      "organizer.isVerified": false,
    })
      .select("name email phone organizer createdAt")
      .sort({ createdAt: -1 });

    const recentBookings = await Booking.find()
      .populate("userId", "name email")
      .populate("showId", "name price")
      .sort({ createdAt: -1 })
      .limit(6);

    const recentShows = await Show.find()
      .populate("organizerId", "name email organizer.organizationName")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalOrganizers,
          pendingOrganizers,
          totalShows,
          activeShows,
          totalBookings,
          totalRevenue,
        },
        pendingOrganizersList,
        recentUsers,
        recentShows,
        recentBookings,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admin dashboard metrics",
    });
  }
};

// Toggle user block status
export const toggleUserBlockStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify organizer request
export const verifyOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const user = await User.findById(organizerId);

    if (!user || user.role !== "organizer") {
      return res.status(404).json({ success: false, message: "Organizer not found" });
    }

    user.organizer.isVerified = true;
    user.organizer.verifiedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Organizer verified successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};