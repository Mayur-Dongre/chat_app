import User from "../models/user.model.js";
import bcrypt from "bcrypt";
// import generateJWTTokenAndSetCookie from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

const signup = async (req, res) => {
	try {
		console.log("came to signup");
		const { username, password } = req.body;

		const foundUser = await User.findOne({ username });

		if (foundUser) {
			return res.status(201).json({ message: "Username already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = new User({ username: username, password: hashedPassword });

		console.log("signed up user: ", user);

		// Generate token
		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: "15d",
		});

		// generateJWTTokenAndSetCookie(user._id, res);
		await user.save();

		res.status(201).json({ message: "User signed up !", token: token, username: user.username });
	} catch (error) {
		console.log("error signing up", error.message);
		res.status(500).json({ message: "User registration failed !" });
	}
};

export default signup;

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });

		if (!user) {
			return res.status(401).json({ message: "User not found !" });
		}

		const passwordMatch = await bcrypt.compare(password, user?.password || "");

		if (!passwordMatch) return res.status(401).json({ message: "Invalid password !" });

		// Generate token
		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: "15d",
		});

		// generateJWTTokenAndSetCookie(user._id, res);
		console.log("logged in user: ", user);

		res.status(200).json({
			_id: user._id,
			username: user.username,
			token: token,
		});
	} catch (error) {
		console.log("error loggin in the user : ", error.message);
		res.status(500).json({ error: "Login Failed !" });
	}
};
