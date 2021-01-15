const Yup = require('yup');
const crypto = require('crypto');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class InstructorKeyController{
  async store(req,res){
    Logger.header('Controller - Instructor Key - Store');
    //Checks if logged user is admin
    const isAdmin = await connection('users')
      .select('users.*')
      .where({'users.id': req.userId})
      .andWhere('users.user_type', '2');
    if(isAdmin.length === 0){
        Logger.error('Unauthorised user');
        return res.status(401).json({ error: 'Unauthorised user'})
    }
    const { email, temp_key } = req.body;
    Logger.log(`[${email}][${temp_key}]`);

    const schema = Yup.object().shape({
      email: Yup.string().email().required('Email is required')   
    });
    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    //checks if email is already in use
    const [emailExists] = await connection('instructor_keys')
      .select('instructor_keys.*')
      .where({ 'instructor_keys.email': email });

    if (emailExists) {
      Logger.error('User already exists');
      return res.status(403).json({ error: 'User already exists' });
    }
    const generateKey = (
        length = 8,
        wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    ) => Array.from(crypto.randomFillSync(new Uint32Array(length)))
          .map((x) => wishlist[x % wishlist.length])
          .join('')
    console.log(generateKey());
    const key = generateKey();
    const tempKey = {
      email,
      temp_key: key
    }
    const insertKey = await connection('instructor_keys').insert(tempKey);
    Logger.success('[200]');
    return res.status(200).json({
      tempKey
    });

  }
  async list(req, res){
    Logger.header('Controller - Instructor Key - List');
    const { search } = req.query;
    let listKey = connection('instructor_keys')
      .select('instructor_keys.*')
      .orderBy('instructor_keys.email', 'desc');
    if(search){
      listKey = listKey.where('instructor_keys.email', 'like', `%${search}%`);
    }
    const query = await listKey;

    const list = query.map((row) =>{
      return{
        email: row.email,
        instructor_key: row.instructor_key
      }
    });
    Logger.success('[200]');
    return res.status(200).json(list);

  }

}

module.exports = new InstructorKeyController;