const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');
const parseISO = require('date-fns/parseISO');
const isAfter = require('date-fns/isAfter');
const format = require('date-fns/format');
const eachMonthOfInterval = require('date-fns/eachMonthOfInterval')
const locale = require('date-fns/locale/pt-BR');
const compareAsc = require('date-fns/compareAsc');

class PaymentController{

  async store(req, res){
    Logger.header('Controller - Payments - Store');

    const { uni_id } = req.body; 
    Logger.log(`[${uni_id}]`);

    const isAdmin = await connection('users')
      .select('users.*')
      .where({'users.id': req.userId});   
    if(isAdmin[0].user_type !== 2){
      Logger.error('Unauthorised user')
      return res.status(401).json({ error: 'Unauthorised user'});
    }
    
    const isFirstPayment = await connection('payments')
      .select('payments.*')
      .where({'payments.student_id': req.params.id});
    if(isFirstPayment.length > 0){
      Logger.error('First payment already registered for this user');
      return res.status(401).json({ error: 'First payment already registered for this user' });     
    }
    
    const schema = Yup.object().shape({
      uni_id: Yup.string().min(9).max(9)
    });
    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }
    
    const payment = {
      student_id: req.params.id,
      uni_id: isFirstPayment.length > 0 ? isFirstPayment[0].uni_id : uni_id,
      paid_at: new Date()
    };
    const nextPayment = {
      student_id: req.params.id,
      uni_id: isFirstPayment.length > 0 ? isFirstPayment[0].uni_id : uni_id,
      paid_at: null
    };
    const isActive = {
      is_active: true
    };

    const insertPayment = await connection('payments').insert(payment).where({'payments.student_id': req.params.id});
    const insertNextPayment = await connection('payments').insert(nextPayment).where({'payments.student_id': req.params.id});
    const activateUser = await connection('users').update(isActive).where({'users.id': req.params.id});
    
    // Implement isActive blocking
    Logger.success('[200]');
    return res.status(200).json({
      insertPayment,
      insertNextPayment,
      activateUser
    });

    
  }
  async list(req, res){
    Logger.header('Controller - List - Payments');

    const isAdmin = await connection('users')
      .select('users.*')
      .where({'users.id': req.userId});   
    if(isAdmin[0].user_type !== 2){
      Logger.error('Unauthorised user')
      return res.status(401).json({ error: 'Unauthorised user'});
    }

    const { search } = req.query;
    let payments = connection('payments')
      .select('payments.*', 'users.*')
      .leftJoin('users', 'student_id', 'users.id')
      .where('users.user_type', 4);
    
    if(search){
      payments = payments.andWhere('users.first_name', 'like', `${search}%`).orWhere('users.surname', 'like', `${search}%`);
    }
    const query = await payments;

    const paymentList = query.map((row) => {
      return{
        first_name: row.first_name,
        surname: row.surname,
        is_active: row.is_active,
        paid_at: row.paid_at !== null ? format(row.paid_at, 'dd/MM/yyyy') : row.paid_at,
        uni_id: row.uni_id
      };     
    });

    Logger.success('[200]');
    return res.status(200).json(paymentList);
  }
  async listOne(req, res){
    Logger.header('Controller - List One - Payment');

    const isAdmin = await connection('users')
      .select('users.*')
      .where({'users.id': req.userId});   
    if(isAdmin[0].user_type !== 2){
      Logger.error('Unauthorised user')
      return res.status(401).json({ error: 'Unauthorised user'});
    }

    const payment = await connection('payments')
      .select('payments.*', 'users.*')
      .leftJoin('users', 'student_id', 'users.id')
      .where({'payments.id': req.params.id});

    const paymentInfo = payment.map((row) => {
      return{
        first_name: row.first_name,
        surname: row.surname,
        is_active: row.is_active,
        paid_at: row.paid_at !== null ? format(row.paid_at, 'dd/MM/yyyy') : row.paid_at,
        uni_id: row.uni_id 
      };
    });
    Logger.success('[200]');
    return res.status(200).json(paymentInfo);
  }
  async update(req, res){
    Logger.header('Controller - Update - Payment');
    const isAdmin = await connection('users')
      .select('users.*')
      .where({'users.id': req.userId});   
    if(isAdmin[0].user_type !== 2){
      Logger.error('Unauthorised user')
      return res.status(401).json({ error: 'Unauthorised user'});
    }

    const getPayment = await connection ('payments')
      .select('payments.*')
      .where({'payments.id': req.params.id});

    if(getPayment[0].paid_at !== null){
      if(format(getPayment[0].paid_at, 'MMMM, yyyy', {locale: locale}) === format(new Date(), 'MMMM, yyyy', {locale: locale})){
        Logger.error('Payment for this month already done');
        return res.status(401).json({ error: 'Payment for this month already done'});
      }
    }
    
    const payment = {
      student_id: getPayment[0].student_id,
      uni_id: getPayment.length > 0 ? getPayment[0].uni_id : uni_id,
      paid_at: new Date()
    };
    const nextPayment = {
      student_id: getPayment[0].student_id,
      uni_id: getPayment.length > 0 ? getPayment[0].uni_id : uni_id,
      paid_at: null
    };
    const isActive = {
      is_active: true
    };

    const insertPayment = await connection('payments').update(payment).where({'payments.id': req.params.id});
    const insertNextPayment = await connection('payments').insert(nextPayment).where({'payments.student_id': getPayment[0].student_id});
    const activateUser = await connection('users').update(isActive).where({'users.id': getPayment[0].student_id});
    
    Logger.success('[200]');
    return res.status(200).json({
      insertPayment,
      insertNextPayment,
      activateUser
    });
  }
}
module.exports = new PaymentController;