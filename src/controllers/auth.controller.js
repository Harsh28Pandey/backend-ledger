const userModel = require("../models/user.model.js")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service.js")
const tokenBlackListModel = require("../models/blacklist.model.js")

/** 
 * - user register controller
 * - POST /api/auth/register
*/

const userRegisterController = async (req, res) => {
    const { email, password, name } = req.body

    const isExists = await userModel.findOne({ email: email })

    if (isExists) {
        return res.status(422).json({
            message: "User already exists with email",
            success: false
        })
    }

    const user = await userModel.create({
        email,
        password,
        name
    })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })

    res.cookie("token", token)
    res.status(201).json({
        message: "User registered sucessfully",
        success: true,
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token: token
    })

    await emailService.sendRegistrationEmail(user.email, user.name)
}

/**
 * - user login controller 
 * - POST /api/auth/login
*/

const userLoginController = async (req, res) => {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password")

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password",
            success: false
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
        return res.status(401).json({
            message: "Invalid email or password",
            success: false
        })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })
    res.cookie("token", token)

    res.status(200).json({
        message: "User logged in sucessfully",
        success: true,
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token: token
    })
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
*/
const userLogoutController = async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully",
            success: true
        })
    }

    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully",
        success: true
    })

}


module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}