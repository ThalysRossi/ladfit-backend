const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class StudentProfileController{
    async store(req, res){
        Logger.header('Controller - Student Profile - Store');
        const { birthdate, gender, phone, motivation, history, weight, height, availability } = req.body;
        Logger.log(
            `[${birthdate}][${gender}][${phone}][${motivation}][${history}][${weight}][${height}][${availability}]`
        );

        

        //Should availability and gender be dropdown?
        const schema = Yup.object().shape({
            birthdate: Yup.date().required('Birthdate is required'),
            gender: Yup.string().required('Gender is required').min(5).max(10),
            phone: Yup.string().required('Phone is required').min(9).max(11),
            motivation: Yup.string().required('Motivation is required').min(5).max(255),
            history: Yup.string().required('History is required').min(5),
            weight: Yup.number().required('Weight is required')
            .positive('Weight cannot be negative').min(30.50).max(300.00),
            height: Yup.number().required('Height is required')
            .positive('Height cannot be negative').min(1.00).max(2.55),
            availability: Yup.string().required('Availability is required')
        });
        if (!(await schema.isValid(req.body))) {
            Logger.error('Validation failed');
            return res.status(400).json({ error: 'Validation failed' });
        }
        //check if profile already exists
        const profileExists = await connection('student_profile')
          .select('student_profile.*')
          .where({'student_profile.user_id': req.userId});
          
        if(profileExists.length > 0){
            Logger.error('Profile already exists');
            return res.status(400).json({error: 'Profile already exists'});
        }
       
        const studentProfile = {
            birthdate, 
            gender, 
            phone, 
            motivation, 
            history, 
            weight, 
            height, 
            availability,
            user_id: req.userId
        };
        const [storeStudentProfile] = await connection('student_profile').insert(studentProfile);

        

        Logger.success('[200]');
        return res.json({
          id: req.userId,
          ...storeStudentProfile,
          });


    }
    async upload(req,res){
        const { originalname: img_name, filename: img_path } = req.file;
        const file = {
          img_name,
          img_path,
          img_type: 'Avatar'
        };
        console.log(req.file);
        
          const insertedFile = await connection('img_paths').insert(file);
          const updateProfile = await connection('student_profile')
            .update({ avatar_id: insertedFile[0] })
            .where({ 'student_profile.user_id': req.userId });
        
        Logger.success('[200]');
        return res.json({
          pic: file,
          id: req.userId
        });
    }
    /*async list(req, res){
        const
    }*/

}

module.exports = new StudentProfileController();