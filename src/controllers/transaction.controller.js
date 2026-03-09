const transactionModel = require("../models/transaction.model.js")
const ledgerModel = require("../models/ledger.model.js")
const emailService = require('../services/email.service.js')
const accountModel = require("../models/account.model.js")
const mongoose = require("mongoose")

/**
 ** - Create a new transaction
 * - THE 10-STEP TRANSFER FLOW:
        * - 1. Validate request
        * - 2. Validate idempotency key
        * - 3. Check account status
        * - 4. Derive sender balance from ledger
        * - 5. Create transaction (PENDING)
        * - 6. Create DEBIT ledger entry
        * - 7. Create CREDIT ledger entry
        * - 8. Mark transaction COMPLETED
        * - 9. Commit MongoDB session
        * - 10. Send email notification
*/

const createTransaction = async (req, res) => {

    /**
     ** - 1. Validate request 
    */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount and idempotencyKey are required",
            success: false
        })
    }

    const fromUserAccount = await accountModel.findOne({ _id: fromAccount })
    const toUserAccount = await accountModel.findOne({ _id: toAccount })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount",
            success: false
        })
    }

    /**
     ** - 2. Validate idempotency key
    */
    const isTransactionAlreadyExixts = await transactionModel.findOne({ idempotencyKey: idempotencyKey })

    if (isTransactionAlreadyExixts) {
        if (isTransactionAlreadyExixts.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already completed",
                success: true,
                transaction: isTransactionAlreadyExixts
            })
        }

        if (isTransactionAlreadyExixts.status === "PENDING") {
            return res.status(400).json({
                message: "Transaction is still processiong",
                success: false
            })
        }

        if (isTransactionAlreadyExixts.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry",
                success: false
            })
        }

        if (isTransactionAlreadyExixts.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry",
                success: false
            })
        }
    }

    /**
     ** - 3. Check account status
    */
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction",
            success: false
        })
    }

    /**
     ** - 4. Derive sender balance from ledger
    */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance current balance is ${balance} and requested amount is ${amount}`,
            success: false
        })
    }


    /**
     ** - 5. Create transaction (PENDING)
    */
    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = (await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }, { session }))[0]

    /**
     * - 6. Create DEBIT ledger entry
    */
    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })

    /**
     * - 7. Create CREDIT ledger entry
    */
    const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    // await (() => {
    //     return new Promise((resolve) => setTimeout(resolve, 100 * 1000))
    // })()

    /**
     * - 8. Mark transaction COMPLETED
    */
    transaction.status = "COMPLETED"
    await transaction.save({ session })

    /**
     * - 9. Commit MongoDB session
    */
    await session.commitTransaction()
    session.endSession()

    /**
     * - 10. Send email notification
    */
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json({
        message: "Transaction completed successfully",
        success: true,
        transaction: transaction
    })

}

const createInitialFundsTransaction = async (req, res) => {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required",
            success: false
        })
    }

    const toUserAccount = await accountModel.findOne({ _id: toAccount })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount",
            success: false
        })
    }

    const fromUserAccount = await accountModel.findOne({
        // systemUser: true,
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found",
            success: false
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        success: true,
        transaction: transaction
    })
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}