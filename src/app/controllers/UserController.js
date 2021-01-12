const bcrypt = require('bcryptjs');
const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class UserController {
  async store(req, res) {
    Logger.header('controller - user - store');
    const { first_name, surname, email, user_type, password, confirmPassword, instructor_key } = req.body;
    Logger.log(
      `[${first_name}][${surname}][${email}][${user_type}][${password}][${confirmPassword}][${instructor_key}]`
    );

    const schema = Yup.object().shape({
      first_name: Yup.string().required('First name is required').max(50),
      surname: Yup.string().required('Surname is required').max(80),
      email: Yup.string().email().required('Email is required'),    
      password: Yup.string().required('Password is required').min(6),
      confirmPassword: Yup.string().required('Password confirmation is required').min(6)
      .test('passwords-match', 'Passwords must match', function(value){
        return this.parent.password === value
      }),
      instructor_key: Yup.string().min(8).max(8)
           
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    /**
     * Verifica existência de usuário.
     */
    const [emailExists] = await connection('users')
      .select('users.*')
      .where({ 'users.email': email });

    if (emailExists) {
      Logger.error('User already exists');
      return res.status(403).json({ error: 'User already exists' });
    }

    /**
     * Criptografa a senha.
     */
    const hashedPassword = await bcrypt.hash(password, 8);

    //Checks if instructor key is valid
    if(instructor_key){
      const isKeyValid = await connection('instructor_keys')
        .select('instructor_keys.*')
        .where({'instructor_keys.temp_key': instructor_key})
        .andWhere({'instructor_keys.email': email});
      if(isKeyValid.length === 0){
        Logger.error('Invalid Instructor Key');
        return res.status(400).json({ error: 'Invalid Instructor Key' });
      }
    }

    const user = {
      first_name,
      surname,
      email,
      password_hash: hashedPassword,
      user_type: instructor_key? '3' : '4',
      instructor_key: instructor_key? instructor_key : null
    };

    /**
     * Insere os dados no banco e retorna o usuário
     */
    const [userId] = await connection('users').insert(user, 'id');
    
    Logger.success('[200]');
    return res.json({
      id: userId,
      ...user,
    });
  }

  async update(req, res) {
    Logger.header('controller - user - update');

    const {
      first_name, 
      surname, 
      email, 
      user_type, 
      oldPassword,
      password, 
      confirmPassword,
    } = req.body;

    Logger.header(
      `[${first_name}][${surname}][${email}][${user_type}][${oldPassword}][${password}][${confirmPassword}]`
    );

    /**
     * Validação de entradas
     */
    const schema = Yup.object().shape({
      first_name: Yup.string().max(50),
      surname: Yup.string().max(80),
      email: Yup.string().email(),    
      oldPassword: Yup.string().min(6), 
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    const [userExists] = await connection('users')
      .select('users.*')
      .where({ 'users.id': req.userId });

    /**
     * Checa se email já existe no banco
     */
    if (email) {
      if (userExists.email === email) {
        Logger.error('Email already in use');
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    /**
     * Checa se a matrícula já existe no banco
     
    if (matricula) {
      if (userExists.matricula === matricula) {
        Logger.error('studentId already in use');
        return res.status(400).json({ error: 'studentId already in use' });
      }
    }*/

    /**
     * Valida que a senha inserida é a mesma armazenada
     */
    const checkPassword = (password) => {
      return bcrypt.compare(password, userExists.password_hash);
    };

    const hashedPassword = password
      ? await bcrypt.hash(password, 8)
      : userExists.password_hash;

    if (oldPassword && !(await checkPassword(oldPassword))) {
      Logger.error('Password does not match');
      return res.status(401).json({ error: 'Password does not match' });
    }

    const user = {
      first_name: first_name || userExists.first_name, 
      surname: surname || userExists.surname, 
      email: email || userExists.email, 
      user_type: user_type || userExists.user_type, 
      password_hash: hashedPassword || userExists.hashedPassword, 
    };

    await connection('users').update(user).where({ 'users.id': req.userId });

    Logger.success('[200]');
    return res.status(200).json({
      id: req.userId,
      ...user,
    });
  }
  // create profile controllers before touching this pile of cesium
  async list(req, res) { 
    Logger.header('Controller - User - List');

    const { search } = req.query;     
    
    let users = connection('users')
      .select('users.*',)
      .orderBy('users.first_name');
    
    if (search) {
      users = users.where('users.first_name', 'like', `%${search}%`).orWhere('users.surname', 'like', `%${search}%`);
    } 
    const query = await users;

    const userList = query.map((row) => { 
      return {
        first_name: row.first_name,
        surname: row.surname,
        email: row.email,
      };
    });
      console.log(userList);

      Logger.success('[200]');

      return res.status(200).json(userList);
    }

  async listOne(req, res) {
    Logger.header('Controller - User - List One');

    const user  = await connection('users')
      .select('users.*')
      .where({'users.id': req.params.id})
    
    if(user.length === 0) { 
      Logger.error('User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    const userInfo = user.map((row) => {
      return {
        first_name: row.first_name,
        surname: row.surname,
        email: row.email,
      }
    });
      Logger.success('[200]');
      return res.status(200).json(userInfo);

  }
}




module.exports = new UserController();
