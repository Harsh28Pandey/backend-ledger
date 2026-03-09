const { Router } = require("express")
const authMiddleware = require("../middlewares/auth.middleware.js")
const transactionController = require('../controllers/transaction.controller.js')

const transactionRoutes = Router()

/**
 * - POST /api/transactions/
 * - Create a new transaction
*/
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
*/
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes