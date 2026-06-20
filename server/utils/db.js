import mongoose from "mongoose";

const CONNECT_DB = async () => {
const URI = process.env.MONGODB_URI;

  try {
    await mongoose.connect(URI);
    console.log("Database connected sucessfully");
  } catch (error) {
    console.log("Database connection failed", error);
  }
};
export default CONNECT_DB;
