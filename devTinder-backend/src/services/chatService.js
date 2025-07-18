const ChatRoom = require("../Models/chatRoom");

/**
 * Find existing 2-person room or create one.
 * @param {string|ObjectId} userId1
 * @param {string|ObjectId} userId2
 * @returns {Promise<ChatRoom>}
 */
async function findOrCreateChatRoom(userId1, userId2) {
  const members = [
    userId1.toString(),
    userId2.toString(),
  ].sort(); // normalize order

  // Try to find a room containing both members and only 2 members
  let room = await ChatRoom.findOne({
    members: { $all: members, $size: 2 },
  });

  if (!room) {
    room = await ChatRoom.create({ members });
  }

  return room;
}

module.exports = { findOrCreateChatRoom };
