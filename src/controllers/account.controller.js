const accountModel = require("../models/account.model.js")

const createAccountController = async (req, res) => {
    const user = req.user
    const account = await accountModel.create({
        user: user._id
    })

    res.status(201).json({
        message: "Account created sucessfully",
        success: true,
        account
    })
}

const getUserAccountsController = async (req, res) => {
    const accounts = await accountModel.find({ user: req.user._id })

    res.status(200).json({
        message: "Accounts fetched sucessfully",
        success: true,
        accounts
    })
}

module.exports = {
    createAccountController,
    getUserAccountsController
}