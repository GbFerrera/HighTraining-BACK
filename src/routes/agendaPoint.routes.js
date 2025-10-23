const {Router} = require("express")
const agendaPointRoutes = Router()

const agendaPointController = require("../controllers/AgendaPointController")

agendaPointRoutes.post("/", agendaPointController.create)
agendaPointRoutes.get("/", agendaPointController.index)
agendaPointRoutes.get("/date/:date", agendaPointController.getByDate)
agendaPointRoutes.get("/:id", agendaPointController.show)
agendaPointRoutes.put("/:id", agendaPointController.update)
agendaPointRoutes.delete("/:id", agendaPointController.delete)

module.exports = agendaPointRoutes
