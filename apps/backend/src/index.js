import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db.js";

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configurar SECRET_KEY com validação
const SECRET_KEY = process.env.SECRET_KEY || 'fallback-secret-key-for-development-only';

// Validar SECRET_KEY
if (!process.env.SECRET_KEY) {
  console.warn('⚠️  AVISO: SECRET_KEY não definida no .env. Usando chave de fallback para desenvolvimento.');
  console.warn('⚠️  Para produção, defina SECRET_KEY no arquivo .env');
}

if (SECRET_KEY === 'fallback-secret-key-for-development-only') {
  console.warn('⚠️  IMPORTANTE: Você está usando a chave de desenvolvimento. Configure uma SECRET_KEY segura para produção!');
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://easycookingbackend.onrender.com',
      'easycooking-delta.vercel.app',
      'https://easycooking-delta.vercel.app'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked CORS request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));
app.use(express.json());

// Rota de teste
app.get("/", async (req, res) => {
  res.send("API funcionando 🚀");
  
});

//verificar estatus do bando de dados
app.get("/status", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar status do banco:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota de diagnóstico para conexão com o banco (útil em deploys como Render)
// - Resolve o host presente em DATABASE_URL
// - Lista endereços IP resolvidos
// - Tenta uma conexão TCP ao primeiro IP na porta do banco
app.get('/debug-db', async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return res.status(400).json({ error: 'DATABASE_URL não definida' });

  try {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname;
    const port = parsed.port ? Number(parsed.port) : 5432;

    // DNS lookup
    const dns = await import('dns').then(m => m.promises);
    const addresses = await dns.lookup(host, { all: true });

    // Tentar conectar TCP ao primeiro IP
    const net = await import('net');
    const ipToTry = addresses[0] && addresses[0].address;
    const timeoutMs = 5000;

    if (!ipToTry) {
      return res.status(500).json({ error: 'Não foi possível resolver nenhum IP para o host', host, addresses });
    }

    await new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let settled = false;

      socket.setTimeout(timeoutMs);
      socket.once('connect', () => {
        settled = true;
        socket.destroy();
        resolve();
      });
      socket.once('timeout', () => {
        if (!settled) {
          settled = true;
          socket.destroy();
          reject(new Error('timeout'));
        }
      });
      socket.once('error', (err) => {
        if (!settled) {
          settled = true;
          socket.destroy();
          reject(err);
        }
      });

      socket.connect(port, ipToTry);
    });

    res.json({ host, addresses, reachable: true, triedIp: ipToTry, port });
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : String(err), details: String(err) });
  }
});

// Iniciar servidor
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  testDatabaseConnection();
});

// Testar conexão com banco com retry
async function testDatabaseConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query("SELECT NOW()");
      console.log("✅ Conexão com banco testada:", result.rows[0]);
      return;
    } catch (error) {
      console.error(`❌ Erro ao conectar ao banco (tentativa ${i + 1}/${retries}):`, error);
      if (i < retries - 1) {
        console.log("⏳ Tentando novamente em 2 segundos...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  console.error("❌ Falha ao conectar ao banco após todas as tentativas.");
}

// #region Login e Registro ------------------------------------------------------

// Rota de registro
app.post("/register", async (req, res) => {
  const { email, name, password, admin } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ message: "Campos obrigatórios ausentes" });
  }

  try {
    const userExistsResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (userExistsResult.rows.length > 0) {
      return res.status(400).json({ message: "Email já existe" });
    }

    const senhaHash = await bcrypt.hash(password, 10);
    const insertQuery = `
      INSERT INTO users (email, name, password, admin)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const insertResult = await pool.query(insertQuery, [
      email,
      name,
      senhaHash,
      admin,
    ]);
    const novoUsuarioId = insertResult.rows[0].id;

    return res.status(201).json({
      message: "Usuário registrado com sucesso",
      success: true,
      id: novoUsuarioId,
      name: name,
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota de login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      `SELECT * FROM users
      WHERE
        REGEXP_REPLACE(
          TRANSLATE(LOWER(email),
            'áàâãäéèêëíìîïóòôõöúùûüç',
            'aaaaaeeeeiiiiooooouuuuc'
          ),
          '\\s', '', 'g'
        ) = REGEXP_REPLACE(
          TRANSLATE(LOWER($1),
            'áàâãäéèêëíìîïóòôõöúùûüç',
            'aaaaaeeeeiiiiooooouuuuc'
          ),
          '\\s', '', 'g'
        )`,
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Email inválido" });
    }

    const usuario = userResult.rows[0];
    const senhaValida = await bcrypt.compare(password, usuario.password);
    if (!senhaValida) {
      return res.status(401).json({ message: "Senha incorreta" });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        admin: usuario.admin,
        name: usuario.name,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      id: usuario.id,
      token,
      admin: usuario.admin,
      name: usuario.name,
      email: usuario.email,
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota de validação de login
app.post("/check-user", async (req, res) => {
  const { field, value } = req.body;

  if (!["email", "name"].includes(field)) {
    return res.status(400).json({ message: "Campo inválido" });
  }

  try {
    const result = await pool.query(
      `SELECT 1 FROM users WHERE LOWER(${field}) = LOWER($1) LIMIT 1`,
      [value]
    );
    res.json({ exists: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

// Rota de login com Google
app.post("/google-login", async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: "Campos obrigatórios ausentes" });
  }

  try {
    let userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    let usuario;
    if (userResult.rows.length === 0) {
      // Registrar novo usuário
      const senhaHash = await bcrypt.hash("google", 10); // senha dummy
      const insertResult = await pool.query(
        "INSERT INTO users (email, name, senhahash, isadmin) VALUES ($1, $2, $3, $4) RETURNING *",
        [email, name, senhaHash, false]
      );
      usuario = insertResult.rows[0];
    } else {
      usuario = userResult.rows[0];
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        isAdmin: usuario.isadmin,
        name: usuario.name,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      id: usuario.id,
      token,
      isAdmin: usuario.isadmin,
      name: usuario.name,
      email: usuario.email,
    });
  } catch (error) {
    console.error("Erro ao fazer login com Google:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// #endregion

// #region Users----------------------------------------------------------------

// Rota para visualizar usuários cadastrados
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, admin FROM users"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    console.error(error.stack);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para visualizar um usuário específico
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, email, name, admin FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para atualizar dados do usuário
app.patch("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const campos = req.body || {};
  console.log("Dados recebidos para atualização:", campos);

  // Verificar se os campos estão no formato correto
  if (campos.phone && typeof campos.phone !== "string") {
    return res
      .status(400)
      .json({ message: "O campo 'phone' deve ser uma string." });
  }

  if (campos.mensalidade && typeof campos.mensalidade !== "string") {
    return res
      .status(400)
      .json({ message: "O campo 'mensalidade' deve ser uma string." });
  }
  console.log("Dados recebidos para atualização:", campos);

  if (Object.keys(campos).length === 0) {
    return res
      .status(400)
      .json({ message: "Nenhum dado fornecido para atualização." });
  }

  try {
    const setClauses = [];
    const values = [];
    let index = 1;

    for (const [chave, valor] of Object.entries(campos)) {
      setClauses.push(`${chave} = $${index}`);
      values.push(valor);
      index++;
    }

    values.push(userId);
    const updateQuery = `
      UPDATE users
      SET ${setClauses.join(", ")}
      WHERE id = $${index}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }



    return res.status(200).json({
      message: "Dados atualizados com sucesso",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota para mudar senha do usuário
app.patch("/user/:id/password", async (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Senha atual e nova senha são obrigatórias.",
    });
  }

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const usuario = userResult.rows[0];

    const senhaValida = await bcrypt.compare(
      currentPassword,
      usuario.senhahash
    );
    if (!senhaValida) {
      return res.status(401).json({ message: "Senha atual incorreta." });
    }

    const novaSenhaHash = await bcrypt.hash(newPassword, 10);

    const updateQuery = `
      UPDATE users
      SET senhahash = $1
      WHERE id = $2
      RETURNING id, email, name, phone
    `;

    const result = await pool.query(updateQuery, [novaSenhaHash, userId]);

    return res.status(200).json({
      message: "Senha alterada com sucesso",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota para deletar usuario com cascade
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Primeiro deletar os checkins do usuário (cascade já está no banco)
    await pool.query("DELETE FROM checkins WHERE user_id = $1", [id]);

    // Depois deletar o usuário
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuario não encontrado" });
    }

    res.status(200).json({ message: "Usuario deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar Usuario:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});
//#endregion

//#region ----------------------------------------------------------------



//#endregion


//#region -----------------------------------------------------------------


//#endregion
