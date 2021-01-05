const jwt = require('jsonwebtoken');
const Yup = require('yup');
const bcrypt = require('bcryptjs');
const connection = require('../../database/connection');
const authConfig = require('../../config/auth');
const Logger = require('../../lib/logger');

class SessionController {
  async store(req, res) {
    Logger.header('controller - session - store');

    const { email, password } = req.body;
    Logger.log(`[${email}][${password}]`);

    /**
     * Validação de entradas
     */
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().min(6).required(),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    /**
     * Verifica se há um email em uso no BD.
     */
    const [userExists] = await connection('users')
      .select('users.*')
      .where({ 'users.email': email });

    if (!userExists) {
      Logger.error('User not found');
      return res.status(400).json({ error: 'User not found' });
    }

    /**
     * Compara a senha inserida com a presente no BD.
     */
    const checkPassword = (password) => {
      return bcrypt.compare(password, userExists.password_hash);
    };

    if (!(await checkPassword(password))) {
      Logger.error('Password does not match');
      return res.status(401).json({ error: 'Password does not match' });
    }

    Logger.success('[200]');
    return res.json({
      user: {
        id: userExists.id,
        first_name: userExists.first_name,
        surname: userExists.surname,
        email: userExists.email,
        user_type: userExists.user_type,
      },
      token: jwt.sign({ id: userExists.id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

module.exports = new SessionController();
