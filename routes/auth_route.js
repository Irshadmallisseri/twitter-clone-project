const express = require('express')
const router = express.Router()
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const UserModel = mongoose.model("UserModel")
const { JWT_SECRET } = require('../config')

router.post('/api/auth/register', async (req, res) => {
    const { name, email, userName, password } = req.body;
    if (!name || !email || !userName || !password) {
        return res.status(400).json({ errror: "One or more mandatory fields are empty" })
    }
    try {
        const userInDB = await UserModel.findOne({ email: email })
        if (userInDB) {
            return res.status(500).json({ error: "User with this email already exists" })
        }

        const hashedPassword = await bcryptjs.hash(password, 16)
        if (hashedPassword) {
            const user = new UserModel({ name, email, userName, password: hashedPassword })
            const newUser = await user.save()

            if (newUser) {
                return res.status(201).json({ result: "User signed up succesfully!" })
            }

        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" })
    }
})

router.post('/api/auth/login', async (req, res) => {
    const { userName, password } = req.body
    if (!userName || !password) {
        return res.status(400).json({ errror: "One or more mandatory fields are empty" })
    }
    try {
        const userInDB = await UserModel.findOne({ userName: userName })
        if (!userInDB) {
            return res.status(401).json({ error: "Invalid credentials" })
        }
        const passwordCheck = await bcryptjs.compare(password, userInDB.password)
        if (passwordCheck) {
            const jwtToken = jwt.sign({ _id: userInDB._id }, JWT_SECRET);
            const userInfo = { "_id": userInDB._id, "email": userInDB.email, "userName": userInDB.userName, "name": userInDB.name };
            res.status(200).json({ result: { token: jwtToken, user: userInfo } });
        } else {
            res.status(401).json({ error: "Invalid credentials" })
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" })
    }
})

module.exports = router;