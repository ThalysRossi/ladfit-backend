const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

const Yup = require('yup');


class ExerciseController {
  async store(req, res) {
    Logger.header('Controller - Exercicios - Store');
    const { exe_type, muscle_group, exe_name } = req.body;
    Logger.log(
      `[${exe_type}][${muscle_group}][${exe_name}]`
    );

    const schema = Yup.object().shape({
      exe_type: Yup.string().required().max(15),
      muscle_group: Yup.string().required().max(20),
      exe_name: Yup.string().required().max(100),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation Failed');
      return res.status(400).json({ error: 'Validation Failed' });
    }

    const [validType] = await connection('exe_valid')
      .select('exe_valid.*')
      .where({'exe_valid.exe_type': exe_type});

    
    if(!validType){
      Logger.error('Invalid exercise type');
      return res.status(403).json({ error: 'Invalid exercise type'});
    }

    const [validGroup] = await connection('exe_valid')
      .select('exe_valid.*')
      .where({'exe_valid.muscle_group': muscle_group});

    if(!validGroup){
      Logger.error('Invalid muscle group');
      return res.status(403).json({ error: 'Invalid muscle group' });
    }
    
    const [nameExists] = await connection('exercises')
      .select('exercises.*')
      .where({'exercises.exe_name': exe_name});

    if(nameExists) {
      Logger.error('Exercise already in database');
      return res.status(403).json({ error: 'Exercise already in database' });
    }
    const [exeValidId] = await connection('exe_valid')
      .select('exe_valid.id')
      .where({'exe_valid.exe_type': exe_type})
      .andWhere({'exe_valid.muscle_group': muscle_group});
      console.log(exeValidId);


    const exercise = {
      exe_name,
      exe_valid_id: exeValidId.id
    };
    const [exerciseId] = await connection('exercises').insert(exercise, 'id');
    Logger.success('[200]');
    return res.json({
      id: exerciseId,
      ...exercise,
    });
  }

  async upload (req, res){
    const { originalname: img_name, filename: img_path } = req.file;
        const file = {
          img_name,
          img_path,
          img_type: 'Exercise'
        };
        console.log(req.file);
        
          const insertedFile = await connection('img_paths').insert(file);
          const updateExercise = await connection('exercises')
            .update({ img_path: insertedFile[0] })
            .where({ 'exercises.id': req.params.id });
        
        Logger.success('[200]');
        return res.json({
          pic: file
        });
  }
  
  async list (req, res) {
    Logger.header('controller - exercises - list');
    const { search } = req.query;
  
    let exercises = connection('exercises')
      .select('exercises.*','exe_valid.*')
      .leftJoin('exe_valid', 'exe_valid_id', 'exe_valid.id')     
      .orderBy('exe_valid.muscle_group', 'asc');
      
    
    if(search) {
      exercises = exercises.where('exercises.exe_name', 'like', `%${search}%`);
    }

    const query = await exercises;
    
    const exerciseList = query.map(row => {
      return {
        exe_name: row.exe_name,
        exe_type: row.exe_type,
        muscle_group: row.muscle_group
      }
    });
      console.log(exerciseList);
      Logger.success('[200]');
      return res.json(exerciseList);
    }

  async listOne(req, res){
    Logger.header('Controller - Exercise - List One');

    const exercise  = await connection('exercises')
      .select('exercises.*', 'exe_valid.*')
      .leftJoin('exe_valid', 'exe_valid_id', 'exe_valid.id')
      .where({'exercises.id': req.params.id})
    
    if(exercise.length === 0) { 
      Logger.error('Exercise not found');
      return res.status(404).json({ error: 'Exercise not found' });
    }
    const exerciseInfo = exercise.map((row) => {
      return {
        id: row.id,
        exe_type: row.exe_type,
        muscle_group: row.muscle_group,
        exe_name: row.exe_name,
      }
    });
      Logger.success('[200]');
      return res.json(exerciseInfo);
  }
  async update(req,res){
    Logger.header('Controller - Exercises - Update');

    const oldExercise  = await connection('exercises')
      .select('exercises.*','exe_valid.*')
      .leftJoin('exe_valid', 'exe_valid_id', 'exe_valid.id')
      .where({'exercises.id': req.params.id})  

    const {
      exe_type,
      muscle_group,
      exe_name
    } = req.body;

    Logger.header(
      `[${exe_type}][${muscle_group}][${exe_name}]`
    );
    
    /**
     * Validação de entradas
     */
    const schema = Yup.object().shape({
      exe_type: Yup.string().required('Type is required').max(15),
      muscle_group: Yup.string().required('Muscle group is required').max(20),
      exe_name: Yup.string().required('Name is required').max(100),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    const [validType] = await connection('exe_valid')
      .select('exe_valid.*')
      .where({'exe_valid.exe_type': exe_type});

    
    if(!validType){
      Logger.error('Invalid exercise type');
      return res.status(403).json({ error: 'Invalid exercise type'});
    }

    const [validGroup] = await connection('exe_valid')
      .select('exe_valid.*')
      .where({'exe_valid.muscle_group': muscle_group});

    if(!validGroup){
      Logger.error('Invalid muscle group');
      return res.status(403).json({ error: 'Invalid muscle group' });
    }
    
    const [nameExists] = await connection('exercises')
      .select('exercises.*')
      .where({'exercises.exe_name': exe_name});

    if(nameExists) {
      Logger.error('Exercise already in database');
      return res.status(403).json({ error: 'Exercise already in database' });
    }

    const [exeValidId] = await connection('exe_valid')
      .select('exe_valid.id')
      .where({'exe_valid.exe_type': exe_type})
      .andWhere({'exe_valid.muscle_group': muscle_group});
      console.log(exeValidId);

    const exercise = {     
      exe_name: exe_name || nameExists.exe_name,
      exe_valid_id: exeValidId.id 
    };

    await connection('exercises').update(exercise).where({ 'exercises.id': req.params.id });

    Logger.success('[200]');
    return res.json({
      old: oldExercise,
      ...exercise,
    });
  }
}

module.exports = new ExerciseController();

