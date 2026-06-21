const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Usuario = require('./models/Usuario');

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_KEY = process.env.GROQ_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

// ── CONECTA AO BANCO ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.log('Erro ao conectar MongoDB:', err.message));

// ── CADASTRO ──
app.post('/api/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;

    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novoUsuario = new Usuario({
      nome,
      email,
      senha: senhaCriptografada,
      perfil
    });

    await novoUsuario.save();

    const token = jwt.sign({ id: novoUsuario._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, nome: novoUsuario.nome, perfil: novoUsuario.perfil });

  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar conta' });
  }
});

// ── LOGIN ──
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ erro: 'Email ou senha incorretos' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(400).json({ erro: 'Email ou senha incorretos' });
    }

    const token = jwt.sign({ id: usuario._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, nome: usuario.nome, perfil: usuario.perfil });

  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// ── CHAT (já existente) ──
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        max_tokens: 500,
        temperature: 0.8
      })
    });

    const dados = await resposta.json();
    res.json(dados);

  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao processar mensagem' });
  }
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});