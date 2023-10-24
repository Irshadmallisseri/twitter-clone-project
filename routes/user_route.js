const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const UserModel = mongoose.model("UserModel")
const TweetModel = mongoose.model("TweetModel")
const protectedRoute = require('../middleware/protectedResources')
const moment = require('moment')
const multer = require('multer')
const upload = require('../routes/file_route')

router.get('/api/user/:id', async (req, res) => {
    try {
        const userInDB = await UserModel.findOne({ _id: req.params.id })
            .populate("followers", "_id name username email")
            .populate("following", "_id name username email")
            .exec();

        if (!userInDB) {
            return res.status(400).json({ error: "User doesn't exist" });
        }

        userInDB.password = undefined;
        res.status(200).json({ user: userInDB });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/api/user/:id/follow', protectedRoute, async (req, res) => {
    const reqId = req.params.id
    try {
        const followUser = await UserModel.findOne({ _id: reqId })
        const currentUser = await UserModel.findOne({ _id: req.user._id })
        if (reqId.toString() === currentUser.toString()) {
            return res.status(400).json({ error: "You cannot follow yourself" })
        }
        if (!followUser) {
            return res.status(404).json({ error: "User not found" })
        }
        if (currentUser.following.includes(reqId)) {
            return res.status(400).json({ error: "You are already following" })
        }
        currentUser.following.push(reqId)
        followUser.followers.push(req.user._id)

        await currentUser.save()
        await followUser.save()
        return res.status(200).json({ result: "User followed successfully" });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.post('/api/user/:id/unfollow', protectedRoute, async (req, res) => {
    const reqId = req.params.id
    try {
        const unfollowUser = await UserModel.findById({ _id: reqId })
        const currentUser = await UserModel.findById({ _id: req.user._id })
        if (reqId.toString() === currentUser.toString()) {
            return res.status(400).json({ error: "You cannot unfollow yourself" })
        }
        if (!unfollowUser) {
            return res.status(404).json({ error: "User not found" })
        }
        if (!currentUser.following.includes(reqId)) {
            return res.status(400).json({ error: "You are already not following" })
        }
        currentUser.following = currentUser.following.filter(id => id.toString() !== reqId)
        unfollowUser.followers = unfollowUser.followers.filter(id => id.toString() !== currentUser._id.toString())

        await currentUser.save()
        await unfollowUser.save()
        return res.status(200).json({ result: "User unfollowed succesfully!" })
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.put('/api/user/:id', protectedRoute, async (req, res) => {
    const { name, dateOfBirth, location } = req.body
    if (!name || !dateOfBirth || !location) {
        return res.status(400).json({ errror: "One or more mandatory fields are empty" })
    }
    if (req.user._id.toString() !== req.params.id) {
        return res.status(403).json({ error: "Unauthorised access" })
    }
    try {
        const updateUser = await UserModel.findById({ _id: req.user._id })
        if (!updateUser) {
            return res.status(404).json({ error: "User not found" })
        }

        const formattedDOB = moment(dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD')
        updateUser.name = name
        updateUser.dateOfBirth = formattedDOB
        updateUser.location = location

        await updateUser.save()
        return res.status(200).json({ user: updateUser })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.post('/api/user/:id/tweets', async (req, res) => {
    try {
        const userTweets = await TweetModel.find({ tweetedBy: req.params.id })
        return res.status(200).json({ result: userTweets })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.post('/api/user/:id/uploadProfilePic', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.profilePicture = req.file.filename;
        await user.save();

        return res.status(200).json({ filename: req.file.filename });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File size limit exceeded. Maximum file size allowed is 2MB." });
        }
    }
    next(err);
});

module.exports = router