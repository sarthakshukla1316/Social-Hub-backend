const RoomModel = require("../models/room-model");

class RoomService {
    async create({ topic, roomType, ownerId }) {
        const room = await RoomModel.create({
            topic,
            roomType,
            ownerId,
            speakers: [ownerId],
        });

        return room;
    }

    async getAllRooms(types) {
        const rooms = RoomModel.find({ roomType: { $in: types } }).populate('speakers').populate('ownerId').exec();
        return rooms;
    }

    async getRoom(roomId) {
        const room = RoomModel.findOne({ _id: roomId });
        return room;
    }

    async deleteRoom(roomId) {
        await RoomModel.deleteOne({ _id: roomId });
    }
}


module.exports = new RoomService();