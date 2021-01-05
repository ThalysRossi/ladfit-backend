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

    /*receive pic, transfer to profile controllers

    const { originalname: nome, filename: caminho } = req.file;
    const file = {
      nome,
      caminho,
    };
    console.log(req.file);
    if(file){
      const insertedFile = await connection('arquivos_img').insert(file);
      const updateUsuario = await connection('usuario')
        .update({ avatar_id: insertedFile[0] })
        .where({ id: userId });
    }
  */

    const schema = Yup.object().shape({
      first_name: Yup.string().required().max(50),
      surname: Yup.string().required().max(80),
      email: Yup.string().email().required(),    
      password: Yup.string().required().min(6),
      confirmPassword: Yup.string().required().min(6)
      .test('passwords-match', 'Passwords must match', function(value){
        return this.parent.password === value
      })
      
      
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

    /* studentId validation, transport to other controller
      const [studentIdExists] = await connection('usuario')
      .select('usuario.*')
      .where({ 'usuario.matricula': matricula });

    if (studentIdExists) {
      Logger.error('User already exists');
      return res.status(403).json({ error: 'User already exists' });
    }*/

    /**
     * Criptografa a senha.
     */
    const hashedPassword = await bcrypt.hash(password, 8);

    //instructor logic
    //if(instructorKey){
    //    const hashedKey = await bcrypt.hash(instructorKey, 8);
    //}

    const user = {
      first_name,
      surname,
      email,
      password_hash: hashedPassword,
      user_type: 'Aluno',
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
      password_hash: password || userExists.hashedPassword, 
    };

    await connection('users').update(user).where({ 'users.id': req.userId });

    Logger.success('[200]');
    return res.json({
      id: req.userId,
      ...user,
    });
  }
  // create profile controllers before touching this pile of cesium
  async list(req, res) { 
    Logger.header('Controller - User - List');

    const { search } = req.query;     
    
    let users = connection('users')
        .select(
          'users.*',
        )
        .orderBy('users.first_name');
    
    if (search) {
      users = users.where('users.first_name', 'like', `%${search}%`)
                    .orWhere('users.surname', 'like', `%${search}%`);
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

      return res.json(userList);
    }

  async listOne(req, res) {
    Logger.header('Controller - User - List One');

    const usuario  = await connection('usuario')
      .select('usuario.*')
      .where({'usuario.id': req.params.id})
    
    if(usuario.length === 0) { 
      Logger.error('User not found');
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const usuarioInfo = usuario.map((row) => {
      return {
        nome: row.primeiro_nome,
        sobrenome: row.sobrenome,
        matricula: row.matricula,
        email: row.email,
        telefone: row.telefone,
      }
    });
      Logger.success('[200]');
      return res.json(usuarioInfo);
    
    



  }
}




module.exports = new UserController();
