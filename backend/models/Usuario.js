const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  perfil: {
    exp: String,
    valor: String,
    obj: String
  },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Usuario', usuarioSchema);