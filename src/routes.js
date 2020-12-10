const Router = require('express').Router;

const UsuarioController = require('./app/controllers/UsuarioController');
const SessionController = require('./app/controllers/SessionController');

const authMiddleware = require('./app/middlewares/auth');

const routes = new Router();

routes.post('/usuario', UsuarioController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);
routes.put('/usuario', UsuarioController.update);
routes.get('/usuario', UsuarioController.list);
routes.get('/usuario/:id', UsuarioController.listOne);



module.exports = routes;
