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

const getAccountBalanceController = async (req, res) => {
    const { accountId } = req.params

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    if (!account) {
        return res.status(404).json({
            message: "Account not found",
            success: false
        })
    }

    const balance = await account.getBalance()
    return res.status(200).json({
        message: "Account balance fetched successfully",
        success: true,
        accountId: account._id,
        balance: balance
    })
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
}