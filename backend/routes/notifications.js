const express = require("express");
const router = express.Router();

// ✅ simple test route to ensure connection
router.get("/", (req, res) => {
  res.json({ message: "Notifications API connected successfully ✅" });
});

module.exports = router;
