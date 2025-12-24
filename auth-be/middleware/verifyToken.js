import jwt from "jsonwebtoken";

const verifyToken = async (req, res, next) => {
	// get token from cookie
	const token = req.cookies.jwt;

	// console.log("Cookie received:", req.cookies); // Debug line
	// console.log("JWT Token:", token); // Debug line

	// check if token exists
	if (!token) {
		return res.status(401).json({ message: "Unauthorized: No token provided" });
	}

	try {
		console.log("Verifying Token ...");
		// verfy token
		const decoded = await jwt.verify(token, process.env.JWT_SECRET);
		next();
	} catch (error) {
		console.log("error verifying token: ", error.message);
		return res.status(401).json({ message: "Unauthorized: Invalid Token" });
	}
};

export default verifyToken;
