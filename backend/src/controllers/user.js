import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import cloudinary from "../libs/cloudinary.js";

const PROFILE_PICTURE_UPLOAD_FOLDER =
  process.env.CLOUDINARY_PROFILE_PICTURE_FOLDER || "projectmanager";

const uploadBufferToCloudinary = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    delete user.password;

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);

    res.status(500).json({ message: "Server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, profilePicture } = req.body;

     const user = await User.findById(req.user._id).select(
      "+profilePicturePublicId",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (req.file) {
      if (user.profilePicturePublicId) {
        await cloudinary.uploader.destroy(user.profilePicturePublicId);
      }

      const uploadedImage = await uploadBufferToCloudinary(
        req.file.buffer,
        PROFILE_PICTURE_UPLOAD_FOLDER,
      );

      user.profilePicture = uploadedImage.secure_url;
      user.profilePicturePublicId = uploadedImage.public_id;
    }

    user.name = name;
    if (!req.file && typeof profilePicture === "string") {
      user.profilePicture = profilePicture;
    }

    await user.save();
    const updatedUser = user.toObject();
    delete updatedUser.profilePicturePublicId;
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);

    res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(403).json({ message: "Invalid old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);

    res.status(500).json({ message: "Server error" });
  }
};

export { getUserProfile, updateUserProfile, changePassword };
