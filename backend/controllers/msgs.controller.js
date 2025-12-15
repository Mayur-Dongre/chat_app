import conversation from "../models/chat.model.js";

export const addMsgToConversation = async (participants, msg) => {
	try {
		// find conversations by participants
		let Conversation = await conversation.findOne({ users: { $all: participants } });
		console.log("Conversation : ", Conversation);

		// if conversation doesn't exist, create a new one
		if (!Conversation) {
			Conversation = await conversation.create({ users: participants });
			console.log("no conversation");
		}

		// Add timestamp if not present
		const msgWithTimestamp = {
			...msg,
			timestamp: msg.timestamp || new Date(),
		};

		// Add msg to the conversation
		Conversation.msgs.push(msgWithTimestamp);
		await Conversation.save();
		// return res.status(200).json(Conversation);
	} catch (error) {
		console.log("error : ", error);
		console.log("error adding msgs to Mongo DB : ", error.message);
	}
};

export const getMsgsForConversation = async (req, res) => {
	try {
		const { sender, receiver } = req.query;
		console.log(sender + receiver);
		const participants = [sender, receiver];
		// Find conversation by participants
		const conv = await conversation.findOne({ users: { $all: participants } });
		if (!conv) {
			console.log("Conversation not found");
			return res.status(200).send();
		}
		return res.json(conv.msgs);
	} catch (error) {
		console.log("Error fetching messages:", error);
		res.status(500).json({ error: "Server error" });
	}
};
