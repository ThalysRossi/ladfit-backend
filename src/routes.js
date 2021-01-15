const Router = require('express').Router;
const multer = require('multer');
const multerConfig = require('./config/multer');

const UserController = require('./app/controllers/UserController');
const SessionController = require('./app/controllers/SessionController');
const ExerciseController = require('./app/controllers/ExerciseController');
const InstructorProfileController = require('./app/controllers/InstructorProfileController');
const StudentProfileController = require('./app/controllers/StudentProfileController');
const FitnessFormController = require('./app/controllers/FitnessFormController');
const InstructorKeyController = require('./app/controllers/InstructorKeyController');
const WorkoutController = require('./app/controllers/WorkoutController');
const StudentAccessController = require('./app/controllers/StudentAccessController');

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
routes.post('/admin/instructor-key', InstructorKeyController.store);
routes.post('/exercises/:id', upload.single('file'), ExerciseController.upload);
routes.post('/workout/student/:id', WorkoutController.store);
routes.post('/workout/student/student-access/:id', StudentAccessController.store);

routes.put('/user', UserController.update);
routes.put('/student-profile/:id', StudentProfileController.update);
routes.put('/exercises/:id', ExerciseController.update);

routes.get('/user', UserController.list);
routes.get('/user/:id', UserController.listOne);
routes.get('/user/:id/form', FitnessFormController.list);
routes.get('/instructor-profile/:id', InstructorProfileController.listOne);
routes.get('/admin/instructor-key/search', InstructorKeyController.list);
routes.get('/student-profile', StudentProfileController.list);
routes.get('/student-profile/:id', StudentProfileController.listOne);
routes.get('/exercises/:id', ExerciseController.listOne);
routes.get('/exercises', ExerciseController.list);
routes.get('/workout/student/:id', WorkoutController.listOne);
routes.get('/workout/student', WorkoutController.list);


module.exports = routes;
