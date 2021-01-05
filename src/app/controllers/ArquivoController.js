const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class ArquivoController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;

    const file = {
      name,
      path,
    };

    const insertedFile = await connection('arquivos_img').insert(file);
    if(!insertedFile){
      Logger.error('[500]');
    }
    if(req.url === '/exercicios/upload'){
      const updateExercicio = await connection('exercicios')
        .update({ img_caminho: insertedFile[0] })
        .where({ id: req.params.id });
    }
    else if(req.url === '/usuario/upload'){
      const updateUsuario = await connection('usuario')
        .update({ avatar_id: insertedFile[0] })
        .where({ id: req.params.id });
    }
    
    Logger.success('[200]');
    return res.json(insertedFile);
    
  }
}


module.exports = new ArquivoController();