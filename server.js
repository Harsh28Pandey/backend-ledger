require("dotenv").config()
const app = require("./src/app.js")
const connectDB = require("./src/config/db.js")

const PORT = 3000

connectDB()

app.listen(PORT, () => {
    console.log("Server is running on Port 3000")
})