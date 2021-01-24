const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');
const parseISO = require('date-fns/parseISO');
const isAfter = require('date-fns/isAfter');
const format = require('date-fns/format');
const eachMonthOfInterval = require('date-fns/eachMonthOfInterval')
const locale = require('date-fns/locale/pt-BR');
const compareAsc = require('date-fns/compareAsc');

class StudentAccessController{
  async store(req, res){
    Logger.header('Controller - Student Access - Store');
    const { time_begin } = req.body;
    Logger.log(`[${time_begin}]`);

    //Checks if user is student
    const isStudent = await connection('users')
      .select('users.*')
      .where({'users.id': req.userId})
      const currentDate = format(new Date(), 'MMMM yyyy', {locale: locale});
      //janky temporary code, fix ASAP
      const isPaid = await connection('payments')
        .select('payments.*')
        .where({'payments.student_id': req.userId});
      if(isPaid.length > 0){
        if(isPaid[0].paid_at !== null){
          for(let i = 0; i < isPaid.length; i++){           
            let paidAt = format(isPaid[i].paid_at, 'MMMM yyyy', {locale: locale});
            if(currentDate === paidAt){
              break;
            }
            else{
              const blocked = {is_active: false};
              const blockAccess = await connection('users').update(blocked).where({'users.id': req.userId});   
            }
          }
        }
      }

    if(!isStudent[0].is_active || isStudent[0].user_type !== 4){
      Logger.error('Unauthorised user');
      return res.status(401).json({ error: 'Unauthorised user'});
    }

    const schema = Yup.object().shape({
      time_begin: Yup.date()
    });
    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }
    
    //checks who the instructor is
    const instructorId = await connection('student_workout')
      .select('student_workout.instructor_id')
      .where({'student_workout.student_id': req.userId});

    const access = {
      student_id: req.userId,
      instructor_id: instructorId[0].instructor_id,
      time_begin: new Date(),
      workout_id: req.params.id,      
    };

    const insert = await connection('student_access').insert(access);
    
    Logger.success('[200]');
    return res.status(200).json(insert);


  }
  async list(req, res){
    Logger.header('Controller - Student Access - List');
    
    const accesses = await connection('student_access')
      .select('student_access.*', 'student_workout.*')
      .leftJoin('student_workout', 'workout_id', 'student_workout.id')
      .where({'student_access.student_id': req.userId});

    if(accesses.length === 0){
      Logger.error('User has not done any workouts');
      return res.status(404).json({ error: 'User has not done any workouts'});
    }
    //use time_end as a reference for listing, time_begin is placeholder
    const accessHistory = accesses.map((row) => {         
      return{
        months: format(row.time_begin, 'MMMM yyyy', {locale: locale}),
        time_begin: format(row.time_begin, 'dd MMM', {locale: locale})+'.', 
        workout_type: 'Treino ' + row.workout_type,      
      };
    });
    Logger.success('[200]');
    return res.status(200).json(accessHistory);      
  }
  async listOne(req, res){
    Logger.header('Controller - Student Access - List One');

    const access = await connection('student_access')
      .select('student_access.*', 'student_workout.*','exercises.*')
      .leftJoin('student_workout', 'workout_id', 'student_workout.id')
      .leftJoin('exercises', 'student_workout.exercise_id', 'exercises.id')
      .where({'student_access.student_id': req.userId})
      .andWhere('student_access.time_begin', 'like', `${req.params.date}%`);
    if(access.length === 0){
      Logger.error('Workout not found');
      return res.status(404).json({ error: 'Workout not found' });
    }

    const accessList = access.map((row) => {
      return{
        time_begin: format(row.time_begin, "dd 'de' MMMM yyyy", {locale: locale}),
        exe_name: row.exe_name,
        repetitions: row.repetitions,
        rest: row.rest,
        sets: row.sets,
        exe_load: row.exe_load
      };
    });
    Logger.success('[200]');
    return res.status(200).json(accessList);
    
  }
  async update(req, res){
    Logger.header('Controller - Student Access - Update');

    const { time_end } = req.body;
    Logger.log(`[${time_end}]`);

    //Checks if user is student
    const isStudent = await connection('users')
      .select('users.*')
      .where({'users.id': req.userId})

    if(!isStudent[0].is_active || isStudent[0].user_type !== 4){
      Logger.error('Unauthorised user');
      return res.status(401).json({ error: 'Unauthorised user'});
    }
    
    //checks if workout is done
    const isWorkoutDone = await connection('student_access')
      .select('student_access.*')
      .where({'student_access.student_id': req.userId})
      .andWhere('student_access.time_begin', 'like', `${req.params.date}%`)
      .orderBy('student_access.time_end');

    for(let i = 0; i < isWorkoutDone.length; i++){ 
      if(isWorkoutDone[i].time_end !== null){
        let storedDate = format(isWorkoutDone[i].time_end, 'yyyy-MM-dd');        
        if(storedDate === req.params.date){
          Logger.error('Workout already concluded');
          return res.status(401).json({ error: 'Workout already concluded'});
        }
      }
    }
    const sendWorkout = {
      time_end: new Date()
    };

    const schema = Yup.object({
      time_end: Yup.date()
    });
    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    for(let i = 0; i < isWorkoutDone.length; i++){
      const updateWorkout = await connection('student_access')
        .update(sendWorkout)
        .where({'student_access.student_id': req.userId})
        .andWhere('student_access.time_begin', 'like', `${req.params.date}%`);
    }
    Logger.success('[200]');
    return res.status(200).json(...updateWorkout);
  }

}
module.exports = new StudentAccessController;