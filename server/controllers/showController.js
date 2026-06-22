import Show from "../models/showModel.js";


// ================= CREATE SHOW =================
export const createShow = async (
  req,
  res
) => {
  try {
     const organizerId = req.user._id;
     const image = req.file?.path;
    const show = await Show.create({
      ...req.body,
      image,
      organizerId,
    });

    return res.status(201).json({
      success: true,
      message: "Show created successfully",
      show,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create show",
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

// ================= GET ALL SHOWS =================
export const getShows = async (req, res) => {
  try {
    const {
      genre,
      city,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      status: "published",
      isVerified: true,
    };

    if (genre) {
      query.genre = genre;
    }

    if (city) {
      query["venue.city"] = city;
    }

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          genre: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const shows = await Show.find(query)
      .populate(
        "organizerId",
        "name email profileImage"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalShows =
      await Show.countDocuments(query);

    return res.status(200).json({
      success: true,
      totalShows,
      currentPage: Number(page),
      totalPages: Math.ceil(
        totalShows / limit
      ),
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
export const updateShow = async (
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
    if (
      show.organizerId.toString() !==
      organizerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to update this show",
      });
    }

    const updatedShow =
      await Show.findByIdAndUpdate(
        id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Show updated successfully",
      show: updatedShow,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update show",
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
    if (
      show.organizerId.toString() !==
      organizerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to delete this show",
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

import Show from "../models/showModel.js";

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
export const getShowByAdminId = async (
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