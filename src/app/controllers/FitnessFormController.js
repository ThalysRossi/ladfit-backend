const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class FitnessFormController {
  async store(req, res){

    //Checks if form is already answered
    const isAnswered = await connection('fitness_form')
      .select('fitness_form.*')
      .where({'fitness_form.student_id': req.params.id});
      if(isAnswered.length > 0){
        Logger.error('[403] - Form already answered');
        return res.status(403).json({ error: 'Form already answered'})
      }
      Logger.header('Controller - Fitness Form PARQ - Store');
      const { question_1, question_2, question_3, question_4, question_5, question_6, question_7} = req.body;
      Logger.log(
        `[${question_1}][${question_2}][${question_3}][${question_4}][${question_5}][${question_6}][${question_7}]`
      );
      const schema = Yup.object().shape({
        question_1: Yup.boolean().required('First question is required'),
        question_2: Yup.boolean().required('Second question is required'),
        question_3: Yup.boolean().required('Third question is required'),
        question_4: Yup.boolean().required('Fourth question is required'),
        question_5: Yup.boolean().required('Fifth question is required'),
        question_6: Yup.boolean().required('Sixth question is required'),
        question_7: Yup.boolean().required('Seventh question is required'),
      });
      if (!(await schema.isValid(req.body))) {
        Logger.error('Validation failed');
        return res.status(400).json({ error: 'Validation failed' });
      }
      

      //Checks if user is instructor
      const isInstructor = await connection('users')
        .select('users.*')
        .where({'users.id': req.userId})
        .andWhere('users.user_type', '=', '3');
     /* evil code 
      let form = {};
      if(isInstructor.length > 0){
          console.log('hey');
            form = {
            student_id: req.params.id,
            instructor_id: req.userId,
            question_1, 
            question_2, 
            question_3, 
            question_4, 
            question_5, 
            question_6, 
            question_7
          };
        const [insertForm] = await connection('fitness_form').insert(form, 'id');
        Logger.success('[200]');
        return res.status(200).json({
          id: insertForm.id,
          ...insertForm
        });
      }*/
      
      const form = {
            student_id: req.params.id,
            question_1, 
            question_2, 
            question_3, 
            question_4, 
            question_5, 
            question_6, 
            question_7
        };
       
      const [insertForm] = await connection('fitness_form').insert(form, 'id');

      Logger.success('[200]');
      return res.status(200).json({
        id: insertForm.id,
        ...insertForm
      });           
    }
    async list(req, res){
      Logger.header('Controller - Fitness Form PARQ - List');

      const answeredForm = await connection('fitness_form')
        .select('fitness_form.*')
        .where({'fitness_form.student_id': req.params.id});

      if(answeredForm.length === 0){
        Logger.error('[404] User not found');
        return res.status(404).json({ error: 'User not found'});
      };
      const formInfo = answeredForm.map((row) => {
        return{
            instructor_id: row.instructor_id,
            question_1: row.question_1,
            question_2: row.question_2,
            question_3: row.question_3,
            question_4: row.question_4,
            question_5: row.question_5,
            question_6: row.question_6,
            question_7: row.question_7
        };
      });
      Logger.success('[200]');
      return res.status(200).json(formInfo);

    }
}

module.exports = new FitnessFormController;