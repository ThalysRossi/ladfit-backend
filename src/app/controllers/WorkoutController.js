const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');
const parseISO = require('date-fns/parseISO');
const isAfter = require('date-fns/isAfter');
const format = require('date-fns/format');


class WorkoutController{
  async store(req, res){
    Logger.header('Controller - Workout - Store');

    //checks if logged user is instructor
    const isInstructor = await connection('users')
      .select('users.*')
      .where({'users.id': req.userId})
      .andWhere('users.user_type', '3');
    if(isInstructor.length === 0){
      Logger.error('Unauthorised user');
      return res.status(401).json({ error: 'Unauthorised user'})
    }
      
    const { exercise_id, workout_type, expiration_date, methodology, repetitions, rest, sets, exe_load } = req.body;
    Logger.log(`[${exercise_id}][${workout_type}][${expiration_date}][${methodology}][${repetitions}][${rest}][${sets}][${exe_load}]`);

    //checks if workout expiration date is after current date
    var currentDate = new Date();
    var future = parseISO(expiration_date);
    const checkDate = isAfter(future, currentDate);
    if(!checkDate){
      Logger.error('[400] - Expiration Date should be after current date');
      return res.status(400).json({error: 'Expiration Date should be after current date'});
    }

    const schema = Yup.object().shape({
      exercise_id: Yup.number().required('Exercise is required').min(1),
      workout_type: Yup.string('A,B or C expected').matches(/[ABC|abc]/).min(1).max(1),
      expiration_date: Yup.date().required('Expiration date is required'),
      methodology: Yup.string().max(20, 'Maximum 20 characters'),
      repetitions: Yup.number().default(0),
      rest: Yup.number().default(0),
      sets: Yup.number().default(0),
      exe_load: Yup.number().default(0)
    });
    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }
    const workout = {
      student_id: req.params.id,
      exercise_id,
      instructor_id: req.userId,
      workout_type,
      expiration_date,
      methodology: methodology ? methodology : null,
      repetitions: repetitions ? repetitions : null,
      rest: rest ? rest : null,
      sets: sets ? sets : null,
      exe_load: exe_load ? exe_load : null
    }
    const storeWorkout = await connection('student_workout').insert(workout, 'id');
      
    Logger.success('[200]');
    return res.status(200).json({
      id: storeWorkout.id,
      ...workout
    });


  }
  //implement student access controller
  async list(req, res){
    Logger.header('Controller - Workout - List');

    //Checks if user is instructor
    const isInstructor = await connection('users')
      .select('users.*')
      .where({'users.id': req.userId})
      .andWhere('users.user_type', '3');

    let workout =  connection('student_workout')
      .select('student_workout.*', 'student_profile.*', 'users.*', 'exercises.*')
      .leftJoin('student_profile', 'student_id', 'student_profile.user_id')
      .leftJoin('users', 'student_id', 'users.id')
      .leftJoin('exercises', 'student_workout.exercise_id', 'exercises.id');
      
    if(isInstructor.length > 0){
      workout = workout.where({'student_workout.instructor_id': req.userId});
    }
    else{
      workout = workout.where({'student_workout.student_id': req.userId});
    }

    const validWorkout = await workout;

    const workoutInfo = validWorkout.map((row) => {
      return{
        first_name: row.first_name,
        surname: row.surname,
        weight: row.weight,
        motivation: row.motivation,
        workout_type: row.workout_type,
        prescribed_at: format(row.prescribed_at, 'dd/MM/yyyy'),
        expiration_date: format(row.expiration_date, 'dd/MM/yyyy'),
        exe_name: row.exe_name,
        sets: row.sets,
        rest: row.rest,
        repetitions: row.repetitions,
        exe_load: row.exe_load,
        
      };
    });
    Logger.success('[200]')
    return res.status(200).json(workoutInfo);
      
  }
  async listOne(req, res){
    Logger.header('Controller - Workout - ListOne');

    let workout =  await connection('student_workout')
      .select('student_workout.*', 'student_profile.*', 'users.*', 'exercises.*')
      .leftJoin('student_profile', 'student_id', 'student_profile.user_id')
      .leftJoin('users', 'student_id', 'users.id')
      .leftJoin('exercises', 'student_workout.exercise_id', 'exercises.id')
      .where({'student_workout.id': req.params.id});

    const workoutInfo = workout.map((row) => {
      return{
        first_name: row.first_name,
        surname: row.surname,
        weight: row.weight,
        motivation: row.motivation,
        workout_type: row.workout_type,
        prescribed_at: format(row.prescribed_at, 'dd/MM/yyyy'),
        expiration_date: format(row.expiration_date, 'dd/MM/yyyy'),
        exe_name: row.exe_name,
        sets: row.sets,
        rest: row.rest,
        repetitions: row.repetitions,
        exe_load: row.exe_load,
        img_path: row.img_path
      };
    });
     
    Logger.success('[200]');
    return res.status(200).json(workoutInfo);

  }
  async update(req, res){
      
  }

}
module.exports = new WorkoutController;