const {Router} = require("express")
const adminsRoutes = Router()

const adminsController = require("../controllers/AdminsController")

adminsRoutes.post("/", adminsController.create)
adminsRoutes.get("/", adminsController.index)
adminsRoutes.get("/:id", adminsController.show)
adminsRoutes.put("/:id", adminsController.update)
adminsRoutes.delete("/:id", adminsController.delete)

module.exports = adminsRoutes
