const express = require("express")
const authMiddleware = require('../middlewares/auth.middleware.js')
const accountController = require('../controllers/account.controller.js')

const router = express.Router()

/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected route
*/
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)

/**
 * - GET /api/accounts/
 * - Get all accounts of the logged-in user
 * - Protected route
*/
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)

/**
 * - GET /api/accounts/balance/:accountId
 * - Get the balance of logged-in user account with the help of accountId
*/
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)

module.exports = router