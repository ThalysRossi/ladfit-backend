const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');
const parseISO = require('date-fns/parseISO');
const isAfter = require('date-fns/isAfter');
const format = require('date-fns/format');

class StudentAccessController{
  async store(req, res){
    Logger.header('Controller - Student Access - Store');
    const { time_begin } = req.body;
    Logger.log(`[${time_begin}]`);

    //Checks if user is student
    const isStudent = await connection('users')
      .select('users.*')
      .where({'users.id': req.userId})
      console.log(isStudent[0].is_active); 

    if(!isStudent[0].is_active || isStudent[0].user_type !== 4){
      Logger.error('Unauthorised user');
      return res.status(401).json({ error: 'Unauthorised user'});
    }
    
    const schema = Yup.object({
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
      time_begin: isoTime,
      workout_id: req.params.id,      
    };

    const insert = await connection('student_access').insert(access);
    
    Logger.success('[200]');
    return res.status(200).json(insert);


  }
  async list(req, res){
    
  }
  async listOne(req, res){
      
  }

}
module.exports = new StudentAccessController;