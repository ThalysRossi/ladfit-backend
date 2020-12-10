const bcrypt = require('bcryptjs');
const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class UsuarioController {
  async store(req, res) {
    Logger.header('controller - user - store');
    const { matricula, primeiro_nome, sobrenome, email, tipo, senha, telefone } = req.body;
    Logger.log(
      `[${matricula}][${primeiro_nome}][${sobrenome}][${email}][${tipo}][${senha}][${telefone}]`
    );

    const schema = Yup.object().shape({
      matricula: Yup.string().required(),
      primeiro_nome: Yup.string().required().max(50),
      sobrenome: Yup.string().required().max(80),
      email: Yup.string().email().required(),
      telefone: Yup.string().required().max(9),
      senha: Yup.string().required().min(6),
      
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    /**
     * Verifica existência de usuário.
     */
    const [emailExists] = await connection('usuario')
      .select('usuario.*')
      .where({ 'usuario.email': email });

    if (emailExists) {
      Logger.error('User already exists');
      return res.status(403).json({ error: 'User already exists' });
    }

    const [studentIdExists] = await connection('usuario')
      .select('usuario.*')
      .where({ 'usuario.matricula': matricula });

    if (studentIdExists) {
      Logger.error('User already exists');
      return res.status(403).json({ error: 'User already exists' });
    }

    /**
     * Criptografa a senha.
     */
    const hashedPassword = await bcrypt.hash(senha, 8);

    const usuario = {
      matricula,
      primeiro_nome,
      sobrenome,
      email,
      telefone,
      senha_hash: hashedPassword,
    };

    /**
     * Insere os dados no banco e retorna o usuário
     */
    const [userId] = await connection('usuario').insert(usuario, 'id');

    Logger.success('[200]');
    return res.json({
      id: userId,
      ...usuario,
    });
  }

  async update(req, res) {
    Logger.header('controller - user - update');

    const {
      matricula,
      primeiro_nome,
      sobrenome,
      email,
      telefone,
      senhaAntiga,
      senha,
      confirmarSenha,
    } = req.body;

    Logger.header(
      `[${matricula}][${primeiro_nome}][${sobrenome}][${email}][${telefone}][${senhaAntiga}][${senha}][${confirmarSenha}]`
    );

    /**
     * Validação de entradas
     */
    const schema = Yup.object().shape({
      matricula: Yup.string().max(9),
      primeiro_nome: Yup.string().max(50),
      sobrenome: Yup.string().max(80),
      email: Yup.string().email(),
      telefone: Yup.string().max(9),
      senhaAntiga: Yup.string().min(6),
      senha: Yup.string()
        .min(6)
        .when('senhaAntiga', (senhaAntiga, field) =>
          senhaAntiga ? field.required() : field
        ),
      confirmarSenha: Yup.string().when('senha', (senha, field) =>
        senha ? field.required().oneOf([Yup.ref('senha')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    const [userExists] = await connection('usuario')
      .select('usuario.*')
      .where({ 'usuario.id': req.userId });

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
     */
    if (matricula) {
      if (userExists.matricula === matricula) {
        Logger.error('studentId already in use');
        return res.status(400).json({ error: 'studentId already in use' });
      }
    }

    /**
     * Valida que a senha inserida é a mesma armazenada
     */
    const checkPassword = (senha) => {
      return bcrypt.compare(senha, userExists.senha_hash);
    };

    const hashedPassword = senha
      ? await bcrypt.hash(senha, 8)
      : userExists.senha_hash;

    if (senhaAntiga && !(await checkPassword(senhaAntiga))) {
      Logger.error('Password does not match');
      return res.status(401).json({ error: 'Password does not match' });
    }

    const usuario = {
      matricula: matricula || userExists.matricula,
      primeiro_nome: primeiro_nome || userExists.primeiro_nome,
      sobrenome: sobrenome || userExists.sobrenome,
      email: email || userExists.email,
      telefone: telefone || userExists.telefone,
      senha_hash: hashedPassword,
    };

    await connection('usuario').update(usuario).where({ 'usuario.id': req.userId });

    Logger.success('[200]');
    return res.json({
      id: req.userId,
      ...usuario,
    });
  }
  async list(req, res) { 
    Logger.header('Controller - User - List');

    const { busca } = req.query;     
    
    
    if (busca) {
      const usuarios = await connection('usuario')
        .select(
          'usuario.*',
        )
        .where('usuario.primeiro_nome', 'like', `%${busca}%`)
        .orWhere('usuario.sobrenome', 'like', `%${busca}%`)
        .orWhere('usuario.matricula', 'like', `%${busca}%`)
        .orderBy('usuario.primeiro_nome');
      
      const usuarioLista = usuarios.map((row) => { 
        return {
          nome: row.primeiro_nome,
          sobrenome: row.sobrenome,
          matricula: row.matricula,
          email: row.email,
          telefone: row.telefone,
        };
      });
      console.log(usuarioLista);

      Logger.success('[200]');

      return res.json(usuarioLista);
    }
    else { 
      const usuarios = await connection('usuario')
        .select('usuario.*')
        .orderBy('usuario.primeiro_nome');
      
      const usuarioLista = usuarios.map((row) => {
        return {
          nome: row.primeiro_nome,
          sobrenome: row.sobrenome,
          matricula: row.matricula,
          email: row.email,
          telefone: row.telefone,
        };
      });
      console.log(usuarioLista);

      Logger.success('[200]');

      return res.json(usuarioLista);    
    }
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




module.exports = new UsuarioController();
