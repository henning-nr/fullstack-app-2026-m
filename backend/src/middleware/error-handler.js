function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === '23503') {
    return res.status(400).json({ message: 'Registro relacionado não encontrado para o vínculo informado.' });
  }

  if (error.code === '23505') {
    return res.status(409).json({ message: 'Já existe um registro com os dados informados.' });
  }

  const status = error.status || 500;
  const message = error.message || 'Erro interno do servidor.';

  return res.status(status).json({ message });
}

module.exports = { errorHandler };
