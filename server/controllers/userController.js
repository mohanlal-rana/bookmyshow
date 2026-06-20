import User from "../models/userModel.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};
export const verifyOrganizer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role !== "organizer") {
      return res.status(400).json({
        message: "User is not an organizer",
      });
    }

    user.organizer.isVerified = true;
    user.organizer.verifiedAt = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: "Organizer verified successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const beOrganizer = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      organizationName,
      address,
      website,
      phone,
      description,
      govIDType,
      govIDNumber,
    } = req.body;

    const profileImage =
      req.files?.profileImage?.[0]?.filename || "";

    const govIDImage =
      req.files?.govIDImage?.[0]?.filename || "";

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "organizer") {
      return res.status(400).json({
        message: "User is already an organizer",
      });
    }

    user.role = "organizer";

    user.organizer = {
      organizationName,
      address,
      website,
      phone,
      description,
      govIDType,
      govIDNumber,
      govIDImage,
      isVerified: false,
    };

    if (profileImage) {
      user.profileImage = profileImage;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User upgraded to organizer successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// 🔒 BLOCK / ACTIVATE USER
export const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;

    // find user
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // toggle isActive
    user.isActive = !user.isActive;
    await user.save();

    // remove password before sending response
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: user.isActive ? "User activated" : "User blocked",
      ...userObj,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};