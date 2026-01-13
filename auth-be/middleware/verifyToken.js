import jwt from "jsonwebtoken";

const verifyToken = async (req, res, next) => {
	// Get token from Authorization header instead of cookie
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "Unauthorized: No token provided" });
	}
	// Extract token (format: "Bearer <token>")
	const token = authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ message: "Unauthorized: No token provided" });
	}

	try {
		console.log("Verifying Token ...");
		const decoded = await jwt.verify(token, process.env.JWT_SECRET);
		req.userId = decoded.userId;
		next();
	} catch (error) {
		console.log("error verifying token: ", error.message);
		return res.status(401).json({ message: "Unauthorized: Invalid Token" });
	}
};

export default verifyToken;
