import conversation from "../models/chat.model.js";

export const addMsgToConversation = async (participants, msg) => {
	try {
		// find conversations by participants
		let Conversation = await conversation.findOne({ users: { $all: participants } });
		console.log("Conversation : ", Conversation);

		// if conversation doesn't exist, create a new one
		if (!Conversation) {
			Conversation = await conversation.create({ users: participants });
			console.log("no conversation found, created new one");
		}

		// Add timestamp if not present
		const msgWithDefaults = {
			...msg,
			timestamp: msg.timestamp || new Date(),
			messageId: msg.messageId || `${Date.now()}-${Math.random()}`,
		};

		console.log("Adding message to conversation:", msgWithDefaults);

		// Add msg to the conversation
		Conversation.msgs.push(msgWithDefaults);
		await Conversation.save();
		console.log("message saved successfully");

		// return res.status(200).json(Conversation);
	} catch (error) {
		console.log("error : ", error);
		console.log("error adding msgs to Mongo DB : ", error.message);
	}
};

// Update Msg Status Function
export const updateMsgStatus = async (participants, messageId, status) => {
	try {
		// find conversation by participants
		const Conversation = await conversation.findOne({ users: { $all: participants } });

		if (!Conversation) {
			console.log("Conversation not found for status update");
			return;
		}

		// find & update message status
		const message = Conversation.msgs.find((msg) => msg.messageId === messageId);

		if (message) {
			message.status = status;
			await Conversation.save();
			console.log(`Message ${messageId} status updated to ${status}`)
		} else {
			console.log(`Message ${messageId} not found in conversation.`);
		}

	} catch (error) {
		console.error("Error updating msg status : ", error);
		console.error("Error updating for msg with msgId : ", messageId);
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
