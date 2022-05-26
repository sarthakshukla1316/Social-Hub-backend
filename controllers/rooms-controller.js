const RoomDto = require("../dtos/room-dto");
const roomService = require("../services/room-service");

class RoomsController {
    async create(req, res) {

        const { roomType, topic } =req.body;
        if(!roomType || !topic) {
            res.status(400).json({ message: 'All fields are required' });
        }

        try {
            const room = await roomService.create({
                topic,
                roomType,
                ownerId: req.user._id,
            });
    
            return res.json(new RoomDto(room));
        } catch(err) {
            res.status(500).json({ message: 'Internal Server error' });
        }
    }

    async index(req, res) {
        try {
            const rooms = await roomService.getAllRooms(['open', 'social', 'private']);
            const allRooms = rooms.map(room => new RoomDto(room));
        
            return res.json(allRooms);
        } catch(err) {
            res.status(500).json({ message: 'Internal Server error' });
        }
    }

    async show(req, res) {
        try {
            const room = await roomService.getRoom(req.params.roomId);
        
            return res.json(new RoomDto(room));
        } catch(err) {
            res.status(500).json({ message: 'Internal Server error' });
        }
    }

    async delete(req, res) {
        try {
            await roomService.deleteRoom(req.params.roomId);
    
            return res.status(200).json('Room delete successfully');
        } catch(err) {
            res.status(500).json({ message: 'Internal Server error' });
        }
    }
}



module.exports = new RoomsController();