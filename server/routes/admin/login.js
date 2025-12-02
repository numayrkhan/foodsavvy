const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ id: username }, process.env.ADMIN_JWT_SECRET, {
      expiresIn: "8h",
    });
    return res.json({ token });
  } else {
    return res.sendStatus(401);
  }
});

module.exports = router;
