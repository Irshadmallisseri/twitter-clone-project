const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }, 
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String
    },
    location: {
        type: String
    },
    dateOfBirth: {
        type: Date
    },
    followers: [
        {
            type: ObjectId,
            ref: "UserModel"
        }
    ],
    following: [
        {
            type: ObjectId,
            ref: "UserModel"
        }
    ]
}, {
    timestamps: true
}
)

mongoose.model("UserModel", userSchema)