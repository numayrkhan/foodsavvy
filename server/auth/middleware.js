const jwt = require("jsonwebtoken");

function authenticateAdminToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ADMIN_JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.admin = { id: decoded.id };
    next();
  });
}

module.exports = authenticateAdminToken;
