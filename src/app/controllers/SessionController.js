const jwt = require('jsonwebtoken');
const Yup = require('yup');
const bcrypt = require('bcryptjs');
const connection = require('../../database/connection');
const authConfig = require('../../config/auth');
const Logger = require('../../lib/logger');

class SessionController {
  async store(req, res) {
    Logger.header('controller - session - store');

    const { email, senha } = req.body;
    Logger.log(`[${email}][${senha}]`);

    /**
     * Validação de entradas
     */
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      senha: Yup.string().min(6).required(),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    /**
     * Verifica se há um email em uso no BD.
     */
    const [userExists] = await connection('usuario')
      .select('usuario.*')
      .where({ 'usuario.email': email });

    if (!userExists) {
      Logger.error('User not found');
      return res.status(400).json({ error: 'User not found' });
    }

    /**
     * Compara a senha inserida com a presente no BD.
     */
    const checkPassword = (senha) => {
      return bcrypt.compare(senha, userExists.senha_hash);
    };

    if (!(await checkPassword(senha))) {
      Logger.error('Password does not match');
      return res.status(401).json({ error: 'Password does not match' });
    }

    Logger.success('[200]');
    return res.json({
      user: {
        id: userExists.id,
        matricula: userExists.matricula,
        primeiro_nome: userExists.primeiro_nome,
        sobrenome: userExists.sobrenome,
        email: userExists.email,
        telefone: userExists.telefone,
      },
      token: jwt.sign({ id: userExists.id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

module.exports = new SessionController();
