const Yup = require('yup');
const bcrypt = require('bcryptjs');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class InstructorProfileController{
  async store(req, res){
    Logger.header('Controller - Instructor Profile - Store');

    const { birthdate, gender, phone, work_shift, instructor_license } = req.body;
    Logger.log(
      `[${birthdate}][${gender}][${phone}][${work_shift}][${instructor_license}]`
    );

    const schema = Yup.object().shape({
      birthdate: Yup.date().required('Birthdate is required'),
      gender: Yup.string().required('Gender is required').min(5).max(10),
      phone: Yup.string().required('Phone is required').min(9).max(11),
      work_shift: Yup.string().required('Shift is required').min(5).max(10),
      instructor_license: Yup.string().required('License is required').min(9).max(9)
    });
    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }


    //Check if instructor license is already in database
    const validLicense = await connection('instructor_profile')
      .select('instructor_profile.*')
      .where({'instructor_profile.instructor_license': instructor_license});
    if(validLicense.length > 0){
      Logger.error('License already in database');
      return res.status('[400]').json({ error: 'License already in database'})
    }

    //check if profile already exists
    const profileExists = await connection('instructor_profile')
      .select('instructor_profile.*')
      .where({'instructor_profile.user_id': req.userId});
          
    if(profileExists.length > 0){
      Logger.error('Profile already exists');
      return res.status(400).json({error: 'Profile already exists'});
    }
        
    const instructorProfile = {
      birthdate,
      gender,
      phone,
      work_shift,
      instructor_license,
      user_id: req.userId          
    };

    const [storeInstructorProfile] = await connection('instructor_profile').insert(instructorProfile)
      Logger.success('[200]');
      return res.json({
        profile: storeInstructorProfile
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
    const updateProfile = await connection('instructor_profile')
      .update({ avatar_id: insertedFile[0] })
      .where({ 'instructor_profile.user_id': req.userId });
        
    Logger.success('[200]');
    return res.json({
      pic: file,
      id: req.userId
    });
  }

  async update(req, res){
    const { birthdate, gender, phone, work_shift, instructor_license } = req.body;
    Logger.log(
      `[${birthdate}][${gender}][${phone}][${work_shift}][${instructor_license}]`
    );

    const schema = Yup.object().shape({
      birthdate: Yup.date(),
      gender: Yup.string().min(5).max(10),
      phone: Yup.string().min(9).max(11),
      work_shift: Yup.string().min(5).max(10),
      instructor_license: Yup.string().min(9).max(9)
    });
    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }
    const instructorProfileExists = await connection('instructor_profile')
      .select('instructor_profile.*', 'users.*')
      .leftJoin('users', 'user_id', 'users.id')
      .where({'instructor_profile.user_id': req.userId})
      .andWhere('users.user_type', '=', '3');
        
    const instructorProfile = {
      birthdate: birthdate || instructorProfileExists.birthdate,
      gender: gender || instructorProfileExists.gender,
      phone: phone || instructorProfileExists.phone,
      work_shift: shift || instructorProfileExists.work_shift,
      instructor_license: instructor_license || instructorProfileExists.instructor_license
    };
    await connection('instructor_profile').update(instructorProfile).where({'instructor_profile.user_id': req.userId});
    
    Logger.success('[200]');
    return res.status(200).json({
      ...instructorProfile
    });   
  }
  async listOne(req, res){
    Logger.header('Controller - Instructor Profile - ListOne');
    
    const profile = await connection('instructor_profile')
      .select('instructor_profile.*', 'users.*')
      .leftJoin('users', 'user_id', 'users.id')
      .where({'instructor_profile.user_id': req.params.id})
    if(profile.length === 0){
      Logger.error('Profile not found');
      return res.status(404).json({ error: 'Profile not found'});
    }
    
    const profileInfo = profile.map((row) => { 
      return{
        first_name: row.first_name,
        surname: row.surname,
        instructor_license: row.instructor_license,
        birthdate: row.birthdate, 
        gender: row.gender, 
        phone: row.phone, 
        avatar_id: row.avatar_id
      }
    });
    Logger.success('[200]');
    return res.status(200).json(profileInfo);
  }
}

module.exports = new InstructorProfileController;