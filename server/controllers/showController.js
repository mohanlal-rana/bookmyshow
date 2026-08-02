import Show from "../models/showModel.js";
import Booking from "../models/bookingModel.js";

// Helper to safely parse JSON strings sent via FormData
const safeParse = (data, fallback = null) => {
  if (typeof data !== "string") return data ?? fallback;
  try {
    return JSON.parse(data);
  } catch (error) {
    return fallback;
  }
};

export const createShow = async (req, res) => {
  try {
    const organizerId = req.user?._id;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Organizer context missing.",
      });
    }

    // --- 1. Parse JSON fields sent via FormData ---
    const venue = safeParse(req.body.venue);
    if (!venue || typeof venue !== "object" || !venue.name || !venue.city || !venue.address) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue format. Provide name, city, and address.",
      });
    }

    const tags = safeParse(req.body.tags, []);
    const artists = safeParse(req.body.artists, []);

    // --- 2. Extract uploaded banner image ---
    // Works with both req.file (single) and req.files (fields)
    let bannerImagePath = "";
    if (req.files?.bannerImage?.[0]) {
      bannerImagePath = req.files.bannerImage[0].path || req.files.bannerImage[0].secure_url || "";
    } else if (req.file) {
      bannerImagePath = req.file.path || req.file.secure_url || "";
    }

    // --- 3. Validate Price & Tickets ---
    const price = Number(req.body.price);
    const totalTickets = Number(req.body.totalTickets);
    const availableTickets = Number(req.body.availableTickets);

    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid ticket price.",
      });
    }

    if (isNaN(totalTickets) || totalTickets < 1) {
      return res.status(400).json({
        success: false,
        message: "Total tickets must be at least 1.",
      });
    }

    // --- 4. Build show object matching ShowSchema ---
    const showData = {
      name: req.body.name,
      description: req.body.description,
      genre: req.body.genre,
      bannerImage: bannerImagePath,
      tags: Array.isArray(tags) ? tags : [],
      artists: Array.isArray(artists) ? artists : [],
      date: req.body.date ? new Date(req.body.date) : undefined,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      venue: {
        name: venue.name,
        city: venue.city,
        address: venue.address,
      },
      price,
      totalTickets,
      availableTickets: isNaN(availableTickets) ? totalTickets : availableTickets,
      maxTicketsPerUser: Number(req.body.maxTicketsPerUser) || 5,
      refundPolicy: req.body.refundPolicy || "No refund available",
      status: req.body.status || "published",
      bookingDeadline: req.body.bookingDeadline ? new Date(req.body.bookingDeadline) : undefined,
      organizerId,
    };

    // --- 5. Save to database ---
    const show = await Show.create(showData);

    return res.status(201).json({
      success: true,
      message: "Show created successfully",
      show,
    });
  } catch (error) {
    console.error("Create show error:", error);

    // Mongoose Validation Error formatting
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map((field) => ({
        field,
        message: error.errors[field].message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
export const getShowsByOrganizer = async (
  req,
  res
) => {
  try {
    const organizerId = req.user._id;

    const shows = await Show.find({
      organizerId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      shows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch shows for the organizer",
    });
  }
}

export const getOneShowByOrganizer = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { id } = req.params;

    const show = await Show.findOne({
      _id: id,
      organizerId,
    });

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    return res.status(200).json({
      success: true,
      show,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch show details",
    });
  }
};

// ================= GET ALL SHOWS =================
export const getShows = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Strict filter: display only published and verified shows
    const query = {
      status: "published",
      isVerified: true,
    };

    const shows = await Show.find(query)
      .populate("organizerId", "name email profileImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalShows = await Show.countDocuments(query);

    return res.status(200).json({
      success: true,
      totalShows,
      currentPage: Number(page),
      totalPages: Math.ceil(totalShows / limit),
      shows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shows",
    });
  }
};

// ================= GET SINGLE SHOW =================
export const getShowById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const show = await Show.findById(id)
      .populate(
        "organizerId",
        "name email profileImage"
      );

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Only allow verified & published shows
    if (
      !show.isVerified ||
      show.status !== "published"
    ) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    show.views += 1;
    await show.save();

    return res.status(200).json({
      success: true,
      show,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch show",
    });
  }
};


// ================= UPDATE SHOW =================
export const updateShow = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await Show.findById(id);
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Authorization (only organizer or admin)
    if (!show.organizerId.equals(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this show",
      });
    }

    // --- Build update object ---
    const updateData = {};

    // Scalars
    const scalarFields = [
      "name", "description", "genre", "startTime", "endTime",
      "refundPolicy", "status"
    ];
    scalarFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    // Numeric fields
    if (req.body.totalTickets !== undefined)
      updateData.totalTickets = Number(req.body.totalTickets);
    if (req.body.availableTickets !== undefined)
      updateData.availableTickets = Number(req.body.availableTickets);
    if (req.body.maxTicketsPerUser !== undefined)
      updateData.maxTicketsPerUser = Number(req.body.maxTicketsPerUser);

    // Dates
    if (req.body.date) updateData.date = new Date(req.body.date);
    if (req.body.bookingDeadline) updateData.bookingDeadline = new Date(req.body.bookingDeadline);

    // JSON fields
    const jsonFields = ["venue", "tags", "artists", "ticketTypes"];
    jsonFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const parsed = safeParse(req.body[field]);
        if (parsed === undefined || parsed === null) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field} format`,
          });
        }
        // For venue, ensure required sub‑fields exist
        if (field === "venue" && (!parsed.name || !parsed.city || !parsed.address)) {
          return res.status(400).json({
            success: false,
            message: "Venue must have name, city, and address",
          });
        }
        updateData[field] = parsed;
      }
    });

    // --- Files ---
    const imageFile = req.files?.image?.[0];
    const bannerFile = req.files?.bannerImage?.[0];
    if (imageFile) updateData.image = imageFile.path;
    if (bannerFile) updateData.bannerImage = bannerFile.path;

    // --- Update ---
    const updatedShow = await Show.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Show updated successfully",
      show: updatedShow,
    });
  } catch (error) {
    console.error("Update show error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE SHOW =================
export const deleteShow = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const organizerId = req.user._id;

    const show = await Show.findById(id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // ================= AUTHORIZATION =================
    if (!show.organizerId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this show",
      });
    }

    await show.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Show deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete show",
    });
  }
};

// ================= GET ALL SHOWS FOR ADMIN =================
export const getShowsByAdmin = async (
  req,
  res
) => {
  try {
    const shows = await Show.find()
      .populate(
        "organizerId",
        "name email profileImage"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: shows.length,
      shows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shows",
    });
  }
};

// ================= GET SINGLE SHOW FOR ADMIN =================
export const getShowByAdminId = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the show details
    const show = await Show.findById(id).populate(
      "organizerId",
      "name email profileImage"
    );

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Fetch all bookings for this show
    const bookings = await Booking.find({ showId: id })
      .populate("userId", "name email phone profileImage")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate total revenue and revenue breakdowns
    const revenueStats = bookings.reduce(
      (acc, booking) => {
        if (booking.paymentStatus === "paid") {
          acc.totalRevenue += booking.totalAmount || 0;
          acc.paidCount += 1;
        } else if (booking.paymentStatus === "pending") {
          acc.pendingRevenue += booking.totalAmount || 0;
          acc.pendingCount += 1;
        } else if (booking.paymentStatus === "refunded") {
          acc.refundedRevenue += booking.totalAmount || 0;
          acc.refundedCount += 1;
        }
        return acc;
      },
      {
        totalRevenue: 0,
        paidCount: 0,
        pendingRevenue: 0,
        pendingCount: 0,
        refundedRevenue: 0,
        refundedCount: 0,
      }
    );

    return res.status(200).json({
      success: true,
      show,
      bookings,
      revenueStats, // Sent to frontend
    });
  } catch (error) {
    console.error("Error fetching show details:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch show details and bookings",
    });
  }
};

// ================= DELETE SHOW BY ADMIN =================
export const deleteShowByAdmin = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const show = await Show.findById(id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    await show.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Show deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete show",
    });
  }
};

// ================= VERIFY SHOW =================
export const verifyShow = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const show = await Show.findById(id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    show.isVerified = true;

    await show.save();

    return res.status(200).json({
      success: true,
      message: "Show verified successfully",
      show,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify show",
    });
  }
};