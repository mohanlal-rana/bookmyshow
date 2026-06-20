import Show from "../models/showModel.js";


// ================= CREATE SHOW =================
export const createShow = async (
  req,
  res
) => {
  try {
     const organizerId = req.user._id;

    const show = await Show.create({
      ...req.body,
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


// ================= GET ALL SHOWS =================
export const getShows = async (
  req,
  res
) => {
  try {
    const {
      genre,
      city,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // ================= FILTER BY GENRE =================
    if (genre) {
      query.genre = genre;
    }

    // ================= FILTER BY CITY =================
    if (city) {
      query["venue.city"] = city;
    }

    // ================= SEARCH =================
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

    // ================= ONLY PUBLISHED =================
    query.status = "published";

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
    console.error(error);

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

    // ================= INCREASE VIEW COUNT =================
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