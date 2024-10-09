const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Conexão com DB
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado ao MongoDB"))
  .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: String
});
const User = mongoose.model('User', UserSchema);

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});
const Exercise = mongoose.model('Exercise', ExerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/index.html'));
});

// 4. POST /api/users - Criar novo usuário
app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ message: "O campo 'username' é obrigatório." });
  }
  const user = new User({ username });
  try {
    const savedUser = await user.save();
    res.json(savedUser);
  } catch (err) {
    res.status(500).json({ message: "Erro ao salvar o usuário", error: err.message });
  }
});

// 5. GET /api/users - Obter todos os usuários
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar usuários", error: err.message });
  }
});

// 8. POST /api/users/:_id/exercises - Adicionar exercício e retornar o objeto de usuário com o exercício
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado!" });
    }

    const exerciseObj = new Exercise({
      user_id: user._id,
      description,
      duration,
      date: date ? new Date(date) : new Date() 
    });

    const exercise = await exerciseObj.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString() 
    });
  } catch (err) {
    res.status(500).json({ message: "Erro ao salvar exercício", error: err.message });
  }
});

// 10. GET /api/users/:_id/logs - Retornar objeto de usuário com contagem de exercícios
app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado!" });
    }

    let filter = { user_id: id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    let exercises = Exercise.find(filter).select('description duration date');
    if (limit) {
      exercises = exercises.limit(parseInt(limit));
    }

    exercises = await exercises.exec();

    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString() 
      }))
    });
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar o log de exercícios", error: err.message });
  }
});

// Listener do servidor
app.listen(PORT, () => {
  console.log(`Seu app está ouvindo na porta ${PORT}`);
});

//js para o  front resolver o workflow
app.get('/public/index.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
    let current_fs, next_fs, previous_fs; 
    let userId;

    document.querySelector(".next").addEventListener("click", async function() {
      const username = document.getElementById('uname').value;

      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });

        const user = await response.json();
        if (response.ok) {
          userId = user._id;
          document.getElementById('uid').value = userId;

          document.querySelectorAll("#progressbar li")[1].classList.add("active");
          current_fs = this.parentElement;
          next_fs = this.parentElement.nextElementSibling;
          next_fs.style.display = "block";
          current_fs.style.display = "none";
        } else {
          alert('Erro ao criar usuário: ' + user.message);
        }
      } catch (err) {
        alert('Erro ao criar usuário.');
      }
    });

    document.querySelectorAll(".previous").forEach(btn => {
      btn.addEventListener("click", function() {
        current_fs = this.parentElement;
        previous_fs = this.parentElement.previousElementSibling;

        previous_fs.style.display = "block";
        current_fs.style.display = "none";

        const stepIndex = Array.from(document.querySelectorAll("fieldset")).indexOf(previous_fs);
        document.querySelectorAll("#progressbar li").forEach((li, index) => {
          if (index > stepIndex) {
            li.classList.remove("active");
          }
        });
      });
    });

    document.querySelector(".submit").addEventListener("click", async function(e) {
      e.preventDefault();
      const description = document.getElementById('desc').value;
      const duration = document.getElementById('dur').value;
      const date = document.getElementById('date').value;

      try {
        const response = await fetch('/api/users/' + userId + '/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, duration, date }),
        });

        const exercise = await response.json();
        if (response.ok) {
          document.querySelectorAll("#progressbar li")[2].classList.add("active");
          current_fs = this.parentElement;
          next_fs = this.parentElement.nextElementSibling;
          next_fs.style.display = "block";
          current_fs.style.display = "none";

          const logResponse = await fetch('/api/users/' + userId + '/logs');
          const log = await logResponse.json();

          const logDiv = document.getElementById('exercise-log');
          logDiv.innerHTML = "<h4>Log de Exercícios:</h4>";
          const lastLog = log.log[log.log.length - 1]; // Corrigido
          logDiv.innerHTML += \`
            <p>
              <strong>Descrição:</strong> \${lastLog.description}<br />
              <strong>Duração:</strong> \${lastLog.duration} minutos<br />
              <strong>Data:</strong> \${new Date(lastLog.date).toDateString()}<br />
            </p>
          \`;

        } else {
          alert('Erro: ' + exercise.message);
        }
      } catch (err) {
        alert('Erro ao adicionar exercício.');
      }
    });

    document.getElementById('restart').addEventListener("click", function() {
      document.querySelectorAll("#progressbar li").forEach(li => li.classList.remove("active"));
      document.querySelector("#progressbar li").classList.add("active");
      document.querySelectorAll("fieldset").forEach(fieldset => fieldset.style.display = "none");
      document.querySelector("fieldset").style.display = "block";
    });
  `);
});
