const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

const Yup = require('yup');

//Change validation methodology

class ExercicioController {
  async store(req, res) {
    Logger.header('Controller - Exercicios - Store');
    const { tipo, grupo_muscular, nome } = req.body;
    Logger.log(
      `[${tipo}][${grupo_muscular}][${nome}]`
    );

    const schema = Yup.object().shape({
      tipo: Yup.string().required().max(12),
      grupo_muscular: Yup.string().required().max(50),
      nome: Yup.string().required().max(100),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validação falhou');
      return res.status(400).json({ error: 'Validação falhou' });
    }

    const tipoValido = [
      "Aeróbico",
      "Anaeróbico",
      "Funcional",
      "Flexibilidade"
    ];
    if(!tipoValido.includes(tipo)){
      Logger.error('Tipo inválido');
      return res.status(403).json({ error: 'Tipo inválido'});
    }

    const grupoMuscularValido = [
      "Não localizado",
      "Deltoides", 
      "Biceps", 
      "Triceps", 
      "Peitoral", 
      "Antebraço", 
      "Obliquos", 
      "Reto Abdominal", 
      "Quadriceps", 
      "Tibialis Anterior", 
      "Trapezio", 
      "Infraespinhal", 
      "Dorsal", 
      "Lombar", 
      "Gluteos", 
      "Posteriores", 
      "Panturrilhas"];
    if(!grupoMuscularValido.includes(grupo_muscular)){
      Logger.error('Grupo Muscular inválido');
      return res.status(403).json({ error: 'Grupo Muscular Inválido'});
    }

    const [nomeExists] = await connection('exercicios')
      .select('exercicios.*')
      .where({'exercicios.nome': nome});

    if(nomeExists) {
      Logger.error('Exercício já existe');
      return res.status(403).json({ error: 'Exercício já existe' });
    }
    
    const exercicio = {
      tipo,
      grupo_muscular,
      nome,
    };
    const [insertExercicio] = await connection('exercicios').insert(exercicio);
    Logger.success('[200]');
    return res.json({
      ...exercicio,
    });
  }

  async list (req, res) {
    Logger.header('controller - exercícios - list');
    const { busca } = req.query;
  
    const exercicios = await connection('exercicios')
      .select('exercicios.*')
      .orderBy('exercicios.tipo', 'desc');
    
    if(busca) {
      exercicios = exercicios.where('exercicios.name', 'like', `%${busca}%`);
    }
    
    const exercicioLista = exercicios.map(row => {
      return {
        nome: row.nome,
        tipo: row.tipo,
        grupo_muscular: row.grupo_muscular
      }
    });
      Logger.success('[200]');
      return res.json(exercicioLista);
    }
  async listOne(req, res){
    Logger.header('Controller - Exercicio - List One');

    const exercicio  = await connection('exercicios')
      .select('exercicios.*')
      .where({'exercicios.id': req.params.id})
    
    if(exercicio.length === 0) { 
      Logger.error('Exercício não encontrado');
      return res.status(404).json({ error: 'Exercício não encontrado' });
    }
    const exercicioInfo = exercicio.map((row) => {
      return {
        id: row.id,
        tipo: row.tipo,
        grupo_muscular: row.grupo_muscular,
        nome: row.nome,
      }
    });
      Logger.success('[200]');
      return res.json(exercicioInfo);
  }
  async update(req,res){
    Logger.header('Controller - Exercicios - Update');

    const exercicioOld  = await connection('exercicios')
      .select('exercicios.*')
      .where({'exercicios.id': req.params.id})  

    const {
      tipo,
      grupo_muscular,
      nome
    } = req.body;

    Logger.header(
      `[${tipo}][${grupo_muscular}][${nome}]`
    );
    
    /**
     * Validação de entradas
     */
    const schema = Yup.object().shape({
      tipo: Yup.string().max(12),
      grupo_muscular: Yup.string().max(50),
      nome: Yup.string().max(100),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    const tipoValido = [
      "Aeróbico",
      "Anaeróbico",
      "Funcional",
      "Flexibilidade"
    ];
    if(!tipoValido.includes(tipo)){
      Logger.error('Tipo inválido');
      return res.status(403).json({ error: 'Tipo inválido'});
    }

    const grupoMuscularValido = [
      "Não localizado",
      "Deltoides", 
      "Biceps", 
      "Triceps", 
      "Peitoral", 
      "Antebraço", 
      "Obliquos", 
      "Reto Abdominal", 
      "Quadriceps", 
      "Tibialis Anterior", 
      "Trapezio", 
      "Infraespinhal", 
      "Dorsal", 
      "Lombar", 
      "Gluteos", 
      "Posteriores", 
      "Panturrilhas"];
    if(!grupoMuscularValido.includes(grupo_muscular)){
      Logger.error('Grupo Muscular inválido');
      return res.status(403).json({ error: 'Grupo Muscular Inválido'});
    }

    const [nomeExists] = await connection('exercicios')
      .select('exercicios.*')
      .where({'exercicios.nome': nome});

    if(nomeExists) {
      Logger.error('Exercício já existe');
      return res.status(403).json({ error: 'Exercício já existe' });
    }

    const exercicio = {
      tipo: tipo || tipoValido.tipo,
      grupo_muscular: grupo_muscular || grupoMuscularValido.grupo_muscular,
      nome: nome || nomeExists.nome,
    };

    await connection('exercicios').update(exercicio).where({ 'exercicios.id': req.params.id });

    Logger.success('[200]');
    return res.json({
      old: exercicioOld,
      ...exercicio,
    });
  }
}

module.exports = new ExercicioController();

