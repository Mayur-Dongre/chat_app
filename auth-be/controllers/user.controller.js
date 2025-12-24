import User from "../models/user.model.js";

const getUsers = async (req, res) => {
	try {
		console.log("fetching users ...")
		// get users
		const users = await User.find({}, "username");
		return res.status(200).json(users);
	} catch (error) {
		console.log("error fetching users: ", error.message);
		return res.status(500).json({ message: "server error" });
	}
};

export default getUsers;