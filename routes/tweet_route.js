const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const protectedRoute = require('../middleware/protectedResources')
const UserModel = mongoose.model('UserModel')
const TweetModel = mongoose.model('TweetModel')
const upload = require('../routes/file_route')
const multer = require('multer');

router.post('/api/tweet', protectedRoute, upload.single('image'), async (req, res) => {
    const { content } = req.body
    let image = null
    if (!content) {
        return res.status(400).json({ error: "Tweet content is required" })
    }
    if (req.file) {
        console.log(req.file.filename)
        image = req.file.filename;
    }
    try {
        const tweetUser = await UserModel.findById({ _id: req.user._id })
        if (!tweetUser) {
            return res.status(404).json({ error: "User not found!" })
        }
        const newTweet = new TweetModel({ content, image, tweetedBy: tweetUser })
        await newTweet.save()
        return res.status(200).json({ result: "Tweet created succesfully" })
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File size limit exceeded. Maximum file size allowed is 2MB." })
        }
    }
    next(err)
})

router.post('/api/tweet/:id/like', protectedRoute, async (req, res) => {
    try {
        const likeUser = await UserModel.findById({ _id: req.user._id })
        if (!likeUser) {
            return res.status(404).json({ error: "User not found" })
        }
        const likePost = await TweetModel.findById({ _id: req.params.id })
        if (!likePost) {
            return res.status(404).json({ error: "Post not found" })
        }
        if (likePost.likes.includes(likeUser._id)) {
            return res.status(400).json({ error: "You have already liked the tweet" })
        }
        likePost.likes.push(likeUser)
        likePost.save()
        return res.status(200).json({ result: "Liked tweet succesfully!" })
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.post('/api/tweet/:id/dislike', protectedRoute, async (req, res) => {
    try {
        const dislikeUser = await UserModel.findById({ _id: req.user._id })
        if (!dislikeUser) {
            return res.status(404).json({ error: "User not found" })
        }
        const dislikePost = await TweetModel.findById({ _id: req.params.id })
        if (!dislikePost) {
            return res.status(404).json({ error: "Post not found" })
        }
        if (!dislikePost.likes.includes(dislikeUser._id)) {
            return res.status(400).json({ error: "You have not liked already" })
        }
        dislikePost.likes = dislikePost.likes.filter(id => id.toString() !== dislikeUser._id.toString())
        dislikePost.save()
        return res.status(200).json({ result: "Tweet disliked succesfully" })
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.post('/api/tweet/:id/reply', protectedRoute, async (req, res) => {
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: "One or more fields are empty" })
    }
    try {
        const parentTweet = await TweetModel.findById({ _id: req.params.id })
        if (!parentTweet) {
            return res.status(404).json({ error: "Parent tweet not found" })
        }
        const replyUser = await UserModel.findById({ _id: req.user._id })
        if (!replyUser) {
            return res.status(404).json({ error: "User not found" })
        }
        const replyTweet = new TweetModel({ content, tweetedBy: replyUser._id })
        await replyTweet.save()
        parentTweet.replies.push(replyUser._id)
        await parentTweet.save()
        return res.status(200).json({ result: "Replied succesfully" })
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/api/tweet/:id', async (req, res) => {
    try {
        const tweet = await TweetModel.findById(req.params.id).populate('likes tweetedBy retweetedBy replies')
        if (!tweet) {
            return res.status(404).json({ error: "Tweet not founds" })
        }
        tweet.likes.forEach((like) => {
            like.password = undefined;
        });

        tweet.tweetedBy.password = undefined;

        tweet.retweetedBy.forEach((retweet) => {
            retweet.password = undefined;
        });

        tweet.replies.forEach((reply) => {
            reply.password = undefined;
        });
        res.status(200).json({ tweet: tweet })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/api/tweet', async (req, res) => {
    try {
        const tweets = await TweetModel.find()
        .populate('likes tweetedBy retweetedBy replies')
        .sort({ createdAt: -1 })
        if (!tweets) {
            return res.status(404).json({ error: "Tweet not founds" })
        }
        tweets.forEach((tweet) => {
            tweet.likes.forEach((like) => {
                like.password = undefined;
            });

            tweet.tweetedBy.password = undefined;

            tweet.retweetedBy.forEach((retweet) => {
                retweet.password = undefined;
            });

            tweet.replies.forEach((reply) => {
                reply.password = undefined;
            });
        });
        res.status(200).json({ tweets: tweets })
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.delete('/api/tweet/:id', protectedRoute, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }
        const deleteTweet = await TweetModel.findById(req.params.id)
        if (!deleteTweet) {
            return res.status(404).json({ error: "Tweet not found" })
        }
        if (user._id.toString() !== deleteTweet.tweetedBy._id.toString()) {
            return res.status(403).json({ error: "Unauthorized access" })
        }

        await deleteTweet.deleteOne()
        return res.status(200).json({ message: "Tweet deleted successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.post('/api/tweet/:id/retweet', protectedRoute, async (req, res) => {
    try {
        const parentPost = await TweetModel.findById(req.params.id)
        if (!parentPost) {
            return res.status(404).json({ error: 'Tweet not found' })
        }
        const retweetUser = await UserModel.findById(req.user._id)
        if (!retweetUser) {
            return res.status(404).json({ error: 'User not found' })
        }
        if (parentPost.tweetedBy.toString() === retweetUser._id.toString()){
            return res.status(400).json({ error: 'Cannot retweet your own tweet' })
        }
        
        const retweet = new TweetModel({ 
            content: parentPost.content, 
            tweetedBy: retweetUser._id, 
            image: parentPost.image,
            retweetedFrom: parentPost._id
        })
        await retweet.save()

        parentPost.retweetedBy.push(retweetUser._id)
        await parentPost.save()

        return res.status(200).json({ message: 'Tweet retweeted successfully' })
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

module.exports = router