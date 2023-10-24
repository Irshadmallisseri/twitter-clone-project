const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const tweetSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    tweetedBy: {
        type: ObjectId,
        ref: "UserModel",
        required: true
    },
    likes: [
        {
            type: ObjectId,
            ref: "UserModel"
        }
    ],
    retweetedBy: [
        {
            type: ObjectId,
            ref: "UserModel"
        }
    ],
    image: {
        type: String
    },
    replies: [
        {
            type: ObjectId,
            ref: "UserModel"
        }
    ],
    retweetedFrom: {
        type: ObjectId,
        ref: 'TweetModel'
    }
}, {
    timestamps: true
})

mongoose.model("TweetModel", tweetSchema)