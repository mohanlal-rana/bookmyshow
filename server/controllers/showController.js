import Show from "../models/showModel.js";
import Booking from "../models/bookingModel.js";
import fetchCoordinates from "../utils/fetchcoordinates.js";
import User from "../models/userModel.js";

// Helper to safely parse JSON strings sent via FormData
export const safeParse = (data, fallback = null) => {
  if (data === null || data === undefined) return fallback;
  if (typeof data === "object") return data;
  try {
    const parsed = JSON.parse(data);
    return parsed ?? fallback;
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
    if (
      !venue ||
      typeof venue !== "object" ||
      !venue.name ||
      !venue.city ||
      !venue.address
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue format. Provide name, city, and address.",
      });
    }

    // --- 2. Fetch Coordinates automatically using Venue Details ---
    let locationData = undefined;

    const inputLat = Number(venue.latitude ?? req.body.latitude);
    const inputLng = Number(venue.longitude ?? req.body.longitude);

    if (
      !isNaN(inputLat) &&
      !isNaN(inputLng) &&
      inputLat !== 0 &&
      inputLng !== 0
    ) {
      locationData = {
        type: "Point",
        coordinates: [inputLng, inputLat],
      };
    } else {
      const coords = await fetchCoordinates(
        venue.address,
        venue.city,
        venue.name,
      );

      if (coords) {
        locationData = {
          type: "Point",
          coordinates: [coords.lng, coords.lat],
        };
      }
    }

    // --- 3. Parse Arrays ---
    const parsedTags = safeParse(req.body.tags, []);
    const parsedArtists = safeParse(req.body.artists, []);

    const tags = Array.isArray(parsedTags) ? parsedTags : [];
    const artists = Array.isArray(parsedArtists)
      ? parsedArtists.filter(
          (item) => typeof item === "object" && item !== null,
        )
      : [];

    // --- 4. Extract uploaded banner image ---
    let bannerImagePath = "";
    if (req.files?.bannerImage?.[0]) {
      bannerImagePath =
        req.files.bannerImage[0].path ||
        req.files.bannerImage[0].secure_url ||
        "";
    } else if (req.file) {
      bannerImagePath = req.file.path || req.file.secure_url || "";
    }

    // --- 5. Validate Price & Tickets ---
    const price = Number(req.body.price);
    const totalTickets = Number(req.body.totalTickets);

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

    // --- 6. Build show object matching ShowSchema ---
    const showData = {
      name: req.body.name,
      description: req.body.description,
      genre: req.body.genre,
      bannerImage: bannerImagePath,
      tags,
      artists,
      date: req.body.date ? new Date(req.body.date) : undefined,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      venue: {
        name: venue.name,
        city: venue.city,
        address: venue.address,
        ...(locationData && { location: locationData }),
      },
      price,
      totalTickets,
      availableTickets: totalTickets,
      maxTicketsPerUser: Number(req.body.maxTicketsPerUser) || 5,
      refundPolicy: req.body.refundPolicy || "No refund available",
      status: req.body.status || "published",
      bookingDeadline: req.body.bookingDeadline
        ? new Date(req.body.bookingDeadline)
        : undefined,
      organizerId,
    };

    // --- 7. Save to database ---
    const show = await Show.create(showData);

    return res.status(201).json({
      success: true,
      message: "Show created successfully",
      show,
    });
  } catch (error) {
    console.error("🔴 Create show error:", error);

    // Mongoose Validation Errors
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

    // Zod Validation Errors (if executed backend-side)
    if (error.errors && Array.isArray(error.errors)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
export const getShowsByOrganizer = async (req, res) => {
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
      message: "Failed to fetch shows for the organizer",
    });
  }
};

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
    const now = new Date(); // Current UTC timestamp

    const query = {
      status: "published",
      isVerified: true,
      $or: [
        { bookingDeadline: { $exists: false } },
        { bookingDeadline: null },
        { bookingDeadline: { $gt: now } }, // Strict comparison
      ],
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
export const getShowById = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await Show.findById(id).populate(
      "organizerId",
      "name email profileImage",
    );

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Only allow verified & published shows
    if (!show.isVerified || show.status !== "published") {
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

    // Authorization check
    if (!show.organizerId.equals(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this show",
      });
    }

    const updateData = {};

    // --- RULE 1: Lock date/time if already verified by Admin ---
    if (show.isVerified && req.user.role !== "admin") {
      if (
        req.body.date !== undefined ||
        req.body.startTime !== undefined ||
        req.body.endTime !== undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Date, Start Time, and End Time cannot be modified once verified by an admin.",
        });
      }
    } else {
      if (req.body.startTime !== undefined)
        updateData.startTime = req.body.startTime;
      if (req.body.endTime !== undefined) updateData.endTime = req.body.endTime;
      if (req.body.date) updateData.date = new Date(req.body.date);
    }

    // --- RULE 2: Prevent status='completed' before show end date/time ---
    const targetStatus =
      req.body.status !== undefined ? req.body.status : show.status;

    if (targetStatus === "completed") {
      const showDateStr = req.body.date || show.date;
      const showEndTimeStr = req.body.endTime || show.endTime;

      // Extract ISO date part (YYYY-MM-DD)
      const formattedDate = new Date(showDateStr).toISOString().split("T")[0];
      const showEndDateTime = new Date(`${formattedDate}T${showEndTimeStr}:00`);

      if (new Date() < showEndDateTime) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot mark a show as completed before its actual end date and time.",
        });
      }
    }

    // --- Scalars ---
    const scalarFields = [
      "name",
      "description",
      "genre",
      "refundPolicy",
      "status",
    ];
    scalarFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    // --- Numeric & Dates ---
    if (req.body.price !== undefined) updateData.price = Number(req.body.price);
    if (req.body.totalTickets !== undefined)
      updateData.totalTickets = Number(req.body.totalTickets);
    if (req.body.availableTickets !== undefined)
      updateData.availableTickets = Number(req.body.availableTickets);
    if (req.body.maxTicketsPerUser !== undefined)
      updateData.maxTicketsPerUser = Number(req.body.maxTicketsPerUser);

    if (req.body.bookingDeadline)
      updateData.bookingDeadline = new Date(req.body.bookingDeadline);

    // --- Array Fields ---
    if (req.body.tags !== undefined) {
      const parsedTags = safeParse(req.body.tags, []);
      updateData.tags = Array.isArray(parsedTags) ? parsedTags : [];
    }

    if (req.body.artists !== undefined) {
      const parsedArtists = safeParse(req.body.artists, []);
      updateData.artists = Array.isArray(parsedArtists)
        ? parsedArtists.filter(
            (item) => typeof item === "object" && item !== null,
          )
        : [];
    }

    // --- Venue Handling ---
    if (req.body.venue !== undefined) {
      const venue = safeParse(req.body.venue, {});

      if (
        !venue ||
        typeof venue !== "object" ||
        !venue.name ||
        !venue.city ||
        !venue.address
      ) {
        return res.status(400).json({
          success: false,
          message: "Venue must have name, city, and address",
        });
      }

      let locationData = show.venue?.location
        ? { ...show.venue.location }
        : null;

      const rawLat = venue.latitude ?? req.body.latitude;
      const rawLng = venue.longitude ?? req.body.longitude;

      const inputLat =
        rawLat !== null && rawLat !== undefined && String(rawLat).trim() !== ""
          ? Number(rawLat)
          : NaN;
      const inputLng =
        rawLng !== null && rawLng !== undefined && String(rawLng).trim() !== ""
          ? Number(rawLng)
          : NaN;

      if (!isNaN(inputLat) && !isNaN(inputLng)) {
        locationData = {
          type: "Point",
          coordinates: [inputLng, inputLat],
        };
      } else {
        const oldVenue = show.venue || {};
        const hasVenueChanged =
          (venue.name || "").trim() !== (oldVenue.name || "").trim() ||
          (venue.address || "").trim() !== (oldVenue.address || "").trim() ||
          (venue.city || "").trim() !== (oldVenue.city || "").trim();

        if (hasVenueChanged || !locationData?.coordinates?.length) {
          const coords = await fetchCoordinates(
            venue.address,
            venue.city,
            venue.name,
          );
          if (coords) {
            locationData = {
              type: "Point",
              coordinates: [coords.lng, coords.lat],
            };
          }
        }
      }

      updateData.venue = {
        name: venue.name,
        city: venue.city,
        address: venue.address,
      };

      if (locationData && Array.isArray(locationData.coordinates)) {
        updateData.venue.location = locationData;
      }
    }

    // --- Files ---
    let bannerImagePath = "";
    if (req.files?.bannerImage?.[0]) {
      bannerImagePath =
        req.files.bannerImage[0].path ||
        req.files.bannerImage[0].secure_url ||
        "";
    } else if (req.file) {
      bannerImagePath = req.file.path || req.file.secure_url || "";
    }

    if (bannerImagePath) {
      updateData.bannerImage = bannerImagePath;
    }

    // --- DB Update ---
    const updatedShow = await Show.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Show updated successfully",
      show: updatedShow,
    });
  } catch (error) {
    console.error("Update show error:", error);

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

// ================= DELETE SHOW =================
export const deleteShow = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await Show.findById(id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // ================= AUTHORIZATION =================
    if (!show.organizerId.equals(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this show",
      });
    }

    // ================= COMPLETION RULE =================
    // Construct the end date-time object
    const formattedDate = new Date(show.date).toISOString().split("T")[0];
    const showEndDateTime = new Date(`${formattedDate}T${show.endTime}:00`);
    const isPastEndTime = new Date() >= showEndDateTime;

    if (show.status !== "completed" && !isPastEndTime) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete a show before it is completed.",
      });
    }

    await show.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Show deleted successfully",
    });
  } catch (error) {
    console.error("Delete show error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete show",
    });
  }
};
// ================= GET ALL SHOWS FOR ADMIN =================
export const getShowsByAdmin = async (req, res) => {
  try {
    const shows = await Show.find()
      .populate("organizerId", "name email profileImage")
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

    const show = await Show.findById(id).populate(
      "organizerId",
      "name email profileImage",
    );

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    const bookings = await Booking.find({ showId: id })
      .populate("userId", "name email phone profileImage")
      .sort({ createdAt: -1 })
      .lean();

    // Revenue calculations
    const revenueStats = bookings.reduce(
      (acc, booking) => {
        const {
          paymentStatus,
          bookingStatus,
          refundStatus,
          totalAmount,
          deductionAmount,
        } = booking;

        // 1. Confirmed & paid bookings → full amount is revenue
        if (bookingStatus === "confirmed" && paymentStatus === "paid") {
          acc.confirmedRevenue += totalAmount || 0;
          acc.confirmedCount += 1;
        }

        // 2. Cancelled & refunded bookings → only the deduction (cancellation fee) is revenue
        if (bookingStatus === "cancelled" && refundStatus === "processed") {
          const fee = deductionAmount || 0;
          acc.cancellationFeeRevenue += fee;
          acc.refundedCount += 1;
          acc.totalRefundedAmount += totalAmount || 0; // track full refunded amount for reporting
        }

        // 3. Pending (unpaid) – not revenue yet
        if (paymentStatus === "pending") {
          acc.pendingCount += 1;
          acc.pendingAmount += totalAmount || 0;
        }

        // 4. Paid but not confirmed? (e.g., payment succeeded but booking still pending) – treat as pending or exclude?
        // Usually should not happen, but we'll add a fallback.
        if (
          paymentStatus === "paid" &&
          bookingStatus !== "confirmed" &&
          bookingStatus !== "cancelled"
        ) {
          // Could be an intermediate state; we'll count as paid but not confirmed
          acc.otherPaidAmount += totalAmount || 0;
        }

        return acc;
      },
      {
        confirmedRevenue: 0,
        confirmedCount: 0,
        cancellationFeeRevenue: 0,
        refundedCount: 0,
        totalRefundedAmount: 0,
        pendingCount: 0,
        pendingAmount: 0,
        otherPaidAmount: 0,
      },
    );

    // Compute total revenue = confirmedRevenue + cancellationFeeRevenue
    const totalRevenue =
      revenueStats.confirmedRevenue + revenueStats.cancellationFeeRevenue;

    // Also compute gross revenue (total sales before refunds) for reference
    const grossRevenue = bookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      show,
      bookings,
      revenueStats: {
        ...revenueStats,
        totalRevenue, // net revenue (money earned)
        grossRevenue, // total sales volume (optional)
      },
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
export const deleteShowByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await Show.findById(id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }
    // ================= COMPLETION RULE =================
    // Construct the end date-time object
    const formattedDate = new Date(show.date).toISOString().split("T")[0];
    const showEndDateTime = new Date(`${formattedDate}T${show.endTime}:00`);
    const isPastEndTime = new Date() >= showEndDateTime;

    if (show.status !== "completed" && !isPastEndTime) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete a show before it is completed.",
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
export const verifyShow = async (req, res) => {
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
export const searchShows = async (req, res) => {
  try {
    const { query, search, city, genre, page = 1, limit = 10 } = req.query;
    const searchTerm = (search || query || "").trim();
    const now = new Date();

    // 1. Base conditions (Always matched)
    const andConditions = [
      { status: "published" },
      { isVerified: true },
      {
        $or: [
          { bookingDeadline: { $exists: false } },
          { bookingDeadline: null },
          { bookingDeadline: { $gt: now } }, // Excludes past deadlines
        ],
      },
    ];

    // 2. Add text search condition
    if (searchTerm) {
      const safeSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(safeSearch, "i");

      andConditions.push({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { genre: searchRegex },
          { "venue.name": searchRegex },
          { "venue.city": searchRegex },
          { tags: searchRegex },
          { "artists.name": searchRegex },
        ],
      });
    }

    // 3. Build final filter object
    const filter = { $and: andConditions };

    // 4. Add City filter
    if (city && city.trim()) {
      const safeCity = city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter["venue.city"] = new RegExp(safeCity, "i");
    }

    // 5. Add Genre filter
    if (genre && genre.trim()) {
      filter.genre = genre.trim();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    // 6. Execute Queries
    const [shows, totalShows] = await Promise.all([
      Show.find(filter)
        .populate("organizerId", "name email profileImage")
        .sort({ date: 1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Show.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      totalShows,
      currentPage: pageNum,
      totalPages: Math.ceil(totalShows / limitNum),
      shows,
    });
  } catch (error) {
    console.error("Search shows error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search shows",
      error: error.message,
    });
  }
};

export const getRecommendedShows = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;

    const now = new Date();
    const baseQuery = {
      status: "published",
      isVerified: true,
      date: { $gte: now },
      bookingDeadline: { $gte: now }, // 👈 Ensures deadline hasn't passed
    };

    // 1. Fetch user's previous bookings
    const userBookings = await Booking.find({ userId }).populate("showId");

    const pastShows = userBookings
      .map((b) => b.showId)
      .filter((show) => show != null && show._id);

    // Convert ObjectIds to Strings for safe matching
    const bookedShowIds = pastShows.map((s) => s._id.toString());

    // If no past bookings exist, return trending shows directly
    if (pastShows.length === 0) {
      const trendingShows = await Show.find(baseQuery)
        .sort({ views: -1, createdAt: -1 })
        .limit(8);

      return res.status(200).json({
        success: true,
        type: "trending",
        shows: trendingShows,
      });
    }

    // 2. Extract unique preferred genres and cities
    const likedGenres = [
      ...new Set(pastShows.map((s) => s.genre).filter(Boolean)),
    ];
    const likedCities = [
      ...new Set(pastShows.map((s) => s.venue?.city).filter(Boolean)),
    ];

    const unbookedBaseQuery = {
      ...baseQuery,
      _id: { $nin: bookedShowIds },
    };

    // 3. Tier 1: Preferred Genre + Preferred City
    let recommendedShows = await Show.find({
      ...unbookedBaseQuery,
      genre: { $in: likedGenres },
      "venue.city": { $in: likedCities },
    })
      .sort({ date: 1 })
      .limit(8);

    // 4. Tier 2: Preferred Genre in Other Cities (Only fetch if Tier 1 < 8)
    if (recommendedShows.length < 8) {
      const existingIds = [
        ...bookedShowIds,
        ...recommendedShows.map((s) => s._id.toString()),
      ];

      const tier2Shows = await Show.find({
        ...baseQuery,
        _id: { $nin: existingIds },
        genre: { $in: likedGenres }, // 👈 Strictly keeps to preferred genres
      })
        .sort({ date: 1 })
        .limit(8 - recommendedShows.length);

      recommendedShows = [...recommendedShows, ...tier2Shows];
    }

    // 5. Fallback ONLY if ZERO personalized shows were found at all
    let responseType = "personalized";
    if (recommendedShows.length === 0) {
      recommendedShows = await Show.find({
        ...baseQuery,
        _id: { $nin: bookedShowIds },
      })
        .sort({ views: -1, createdAt: -1 })
        .limit(8);

      responseType = "trending";
    }

    return res.status(200).json({
      success: true,
      type: responseType,
      shows: recommendedShows,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
    });
  }
};

export const toggleSaveShow = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { showId } = req.params;

    // Validate show existence
    const show = await Show.findById(showId);
    if (!show) {
      return res
        .status(404)
        .json({ success: false, message: "Show not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the event is already saved
    const isSaved = user.savedEvents.includes(showId);

    if (isSaved) {
      // Remove from savedEvents
      user.savedEvents = user.savedEvents.filter(
        (id) => id.toString() !== showId.toString(),
      );
    } else {
      // Add to savedEvents
      user.savedEvents.push(showId);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: isSaved
        ? "Show removed from saved events"
        : "Show saved successfully",
      savedEvents: user.savedEvents,
      isSaved: !isSaved,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSavedShows = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).populate("savedEvents");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      savedShows: user.savedEvents || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
