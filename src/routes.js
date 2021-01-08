const Router = require('express').Router;
const multer = require('multer');
const multerConfig = require('./config/multer');

const UserController = require('./app/controllers/UserController');
const SessionController = require('./app/controllers/SessionController');
const ExerciseController = require('./app/controllers/ExerciseController');
const InstructorProfileController = require('./app/controllers/InstructorProfileController');
const StudentProfileController = require('./app/controllers/StudentProfileController');
const FitnessFormController = require('./app/controllers/FitnessFormController');

const authMiddleware = require('./app/middlewares/auth');

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/user', UserController.store);
routes.post('/sessions', SessionController.store);



routes.use(authMiddleware);
routes.post('/exercises', ExerciseController.store);
routes.post('/student-profile', StudentProfileController.store);
routes.post('/user/:id/form', FitnessFormController.store);
routes.post('/student-profile/upload', upload.single('file'), StudentProfileController.upload);
routes.post('/instructor-profile', InstructorProfileController.store);
routes.post('/instructor-profile/upload', upload.single('file'), InstructorProfileController.upload);
routes.post('/exercises/:id', upload.single('file'), ExerciseController.upload);

routes.put('/user', UserController.update);
routes.put('/student-profile/:id', StudentProfileController.update);
routes.put('/exercises/:id', ExerciseController.update);

routes.get('/user', UserController.list);
routes.get('/user/:id', UserController.listOne);
routes.get('/user/:id/form', FitnessFormController.list);
routes.get('/instructor-profile/:id', InstructorProfileController.listOne);
routes.get('/student-profile', StudentProfileController.list);
routes.get('/student-profile/:id', StudentProfileController.listOne);
routes.get('/exercises/:id', ExerciseController.listOne);
routes.get('/exercises', ExerciseController.list);


module.exports = routes;
