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

		// Add msg to the conversation
		Conversation.msgs.push(msg);
		await Conversation.save();
		// return res.status(200).json(Conversation);
	} catch (error) {
		console.log("error : ", error);
		console.log("error adding msgs to Mongo DB : ", error.message);
	}
};


