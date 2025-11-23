import User from "../models/user.model.js";
import bcrypt from "bcrypt";

const signup = async (req, res) => {
  try {
    console.log("came to signup");
    const { username, password } = req.body;

    const foundUser = await User.findOne({ username });

    if (foundUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username: username, password: hashedPassword });

    console.log(user);

    await user.save();

    res.status(201).json({ message: "User signed up" });
  } catch (error) {
    console.log("error signing up", error.message);
    res.status(500).json({ message: "User registration failed" });
  }
};

export default signup;
