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
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'easycooking-delta.vercel.app'], // Allow localhost and production domain
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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

// Iniciar servidor
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  testDatabaseConnection();
});

// Testar conexão com banco
async function testDatabaseConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Conexão com banco testada:", result.rows[0]);
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco:", error);
  }
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
  const { login, password } = req.body;

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
        )
        OR
        REGEXP_REPLACE(
          TRANSLATE(LOWER(name),
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
      [login]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Email inválido" });
    }

    const usuario = userResult.rows[0];
    const senhaValida = await bcrypt.compare(password, usuario.senhahash);
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
