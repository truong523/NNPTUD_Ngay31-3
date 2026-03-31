const express = require('express');
const router = express.Router();
const Message = require('../schemas/messages');
const auth = require('../utils/authHandler');


// GET "/:userID"
// lấy toàn bộ tin nhắn giữa 2 user
router.get('/:userID', auth.CheckLogin, async (req, res) => {
    try {
        const currentUser = req.user._id;
        const { userID } = req.params;

        const messages = await Message.find({
            $or: [
                { from: currentUser, to: userID },
                { from: userID, to: currentUser }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// POST "/:userID"
// gửi tin nhắn
router.post('/:userID', auth.CheckLogin, async (req, res) => {
    try {
        const currentUser = req.user._id;
        const { userID } = req.params;

        let messageContent;

        // nếu có file (dùng multer)
        if (req.file) {
            messageContent = {
                type: "file",
                text: req.file.path
            };
        } else {
            messageContent = {
                type: "text",
                text: req.body.text
            };
        }

        const message = await Message.create({
            from: currentUser,
            to: userID,
            messageContent
        });

        res.json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET "/"
// lấy message cuối của mỗi cuộc hội thoại
router.get('/', auth.CheckLogin, async (req, res) => {
    try {
        const currentUser = req.user._id;

        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { from: currentUser },
                        { to: currentUser }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$from", currentUser] },
                            "$to",
                            "$from"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            }
        ]);

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;