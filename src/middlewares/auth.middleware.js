const userModel = require("../models/user.model.js")
const jwt = require("jsonwebtoken")

const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing",
            success: false
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId)
        req.user = user
        return next()

    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, invalid token",
            success: false
        })
    }
}

const authSystemUserMiddleware = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing",
            success: false
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId).select("+systemUser")

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user",
                success: false
            })
        }

        req.user = user
        return next()

    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid",
            success: false
        })
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}