const fillFileNames = (req, res, next) => {
  if (req.files) {
    if (req.files["profileImage"]) {
      req.body.profileImage = req.files["profileImage"][0].filename;
    }
    if (req.files["govIDImage"]) {
      req.body.govIDImage = req.files["govIDImage"][0].filename;
    }
  }
  next();
};
export default fillFileNames;
