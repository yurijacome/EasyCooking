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
  origin: ['http://localhost:3000', 'https://ringstrike.vercel.app'], // Allow localhost and production domain
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
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
  const { email, nome, senha, isAdmin } = req.body;

  if (!email || !nome || !senha) {
    return res.status(400).json({ message: "Campos obrigatórios ausentes" });
  }

  try {
    const userExistsResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (userExistsResult.rows.length > 0) {
      return res.status(400).json({ message: "Usuário já existe" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const insertQuery = `
      INSERT INTO users (email, nome, senhahash, isadmin)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const insertResult = await pool.query(insertQuery, [
      email,
      nome,
      senhaHash,
      !!isAdmin,
    ]);
    const novoUsuarioId = insertResult.rows[0].id;

    return res.status(201).json({
      message: "Usuário registrado com sucesso",
      success: true,
      id: novoUsuarioId,
      nome: nome,
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota de login
app.post("/login", async (req, res) => {
  const { login, senha } = req.body;

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
          TRANSLATE(LOWER(nome),
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
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const usuario = userResult.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senhahash);
    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        isAdmin: usuario.isadmin,
        nome: usuario.nome,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      id: usuario.id,
      token,
      isAdmin: usuario.isadmin,
      nome: usuario.nome,
      email: usuario.email,
      phone: usuario.phone || "",
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota de validação de login
app.post("/check-user", async (req, res) => {
  const { field, value } = req.body;

  if (!["email", "nome"].includes(field)) {
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
  const { email, nome } = req.body;

  if (!email || !nome) {
    return res.status(400).json({ message: "Campos obrigatórios ausentes" });
  }

  try {
    let userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    let usuario;
    if (userResult.rows.length === 0) {
      // Registrar novo usuário
      const senhaHash = await bcrypt.hash("google", 10); // senha dummy
      const insertResult = await pool.query(
        "INSERT INTO users (email, nome, senhahash, isadmin) VALUES ($1, $2, $3, $4) RETURNING *",
        [email, nome, senhaHash, false]
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
        nome: usuario.nome,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      id: usuario.id,
      token,
      isAdmin: usuario.isadmin,
      nome: usuario.nome,
      email: usuario.email,
      phone: usuario.phone || "",
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
      "SELECT id, email, nome, phone, mensalidade, isadmin FROM users"
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
      "SELECT id, email, nome, phone, mensalidade, isadmin FROM users WHERE id = $1",
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
      RETURNING id, email, nome, phone
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

//#region Turmas----------------------------------------------------------------

// Rota para pegar turmas existentes
app.get("/turmas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM turmas ORDER BY id ASC");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar turmas:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para adicionar turma
app.post("/turma", async (req, res) => {
  const { nome, horario, tipoData, diaEspecifico, dias } = req.body;

  console.log("📥 Dados recebidos:", req.body);

  try {
    const result = await pool.query(
      `INSERT INTO turmas (nome, horario, tipo_data, dia_especifico, dias)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        nome,
        horario,
        tipoData,
        tipoData === "Data unica" ? diaEspecifico || null : null,
        tipoData === "Constante" && Array.isArray(dias) ? dias : null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar turma:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para editar turma com validação e logging detalhado
app.put("/turma/:id", async (req, res) => {
  const id = req.params.id;
  const { nome, horario, tipoData, diaEspecifico, dias } = req.body;

  console.log("📥 Recebendo dados para atualizar turma:", {
    id,
    nome,
    horario,
    tipoData,
    diaEspecifico,
    dias,
  });

  try {
    // Validação dos campos obrigatórios
    if (!nome || nome.trim() === "") {
      return res.status(400).json({
        message: "O campo 'nome' é obrigatório",
      });
    }

    if (!horario || horario.trim() === "") {
      return res.status(400).json({
        message: "O campo 'horario' é obrigatório",
      });
    }

    if (!tipoData || !["Constante", "Data unica"].includes(tipoData)) {
      return res.status(400).json({
        message: "O campo 'tipoData' deve ser 'Constante' ou 'Data unica'",
      });
    }

    // Validação específica para tipoData
    if (tipoData === "Data unica" && !diaEspecifico) {
      return res.status(400).json({
        message:
          "O campo 'diaEspecifico' é obrigatório quando tipoData é 'Data unica'",
      });
    }

    if (
      tipoData === "Constante" &&
      (!Array.isArray(dias) || dias.length === 0)
    ) {
      return res.status(400).json({
        message:
          "O campo 'dias' deve conter pelo menos um dia quando tipoData é 'Constante'",
      });
    }

    // Verificar se já existe outra turma com o mesmo nome
    const existingTurma = await pool.query(
      "SELECT id FROM turmas WHERE nome = $1 AND id != $2",
      [nome.trim(), id]
    );

    if (existingTurma.rows.length > 0) {
      return res.status(409).json({
        message: "Já existe uma turma com este nome",
      });
    }

    // Preparar os dados para atualização
    const updateData = {
      nome: nome.trim(),
      horario: horario.trim(),
      tipo_data: tipoData,
      dia_especifico: tipoData === "Data unica" ? diaEspecifico : null,
      dias: tipoData === "Constante" ? dias : null,
    };

    console.log("🔄 Atualizando turma com dados:", updateData);

    const result = await pool.query(
      `UPDATE turmas 
       SET nome = $1, 
           horario = $2, 
           tipo_data = $3, 
           dia_especifico = $4, 
           dias = $5 
       WHERE id = $6
       RETURNING *`,
      [
        updateData.nome,
        updateData.horario,
        updateData.tipo_data,
        updateData.dia_especifico,
        updateData.dias,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Turma não encontrada",
      });
    }

    console.log("✅ Turma atualizada com sucesso:", result.rows[0]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Erro ao editar turma:", {
      message: error.message,
      stack: error.stack,
      detail: error.detail || error,
    });

    // Tratamento específico para erros de constraint
    if (error.code === "23505") {
      // unique_violation
      return res.status(409).json({
        message: "Já existe uma turma com este nome",
      });
    }

    if (error.code === "23502") {
      // not_null_violation
      return res.status(400).json({
        message: "Campos obrigatórios não podem ser nulos",
      });
    }

    res.status(500).json({
      message: "Erro interno do servidor",
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Rota para deletar turma
app.delete("/turma/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM turmas WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Turma não encontrada" });
    }

    res.status(200).json({ message: "Turma deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar turma:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

//#endregion

//#region Checkin-----------------------------------------------------------------

// Listar checkins
app.get("/checkins", async (req, res) => {
  try {
    const { turma_id } = req.query;
    let query = `
      SELECT c.id, c.user_id, c.nome, c.turma_id, c.criado_em, c.checkinstatus, t.tipo_data
      FROM checkins c
      LEFT JOIN turmas t ON c.turma_id = t.id
    `;

    if (turma_id) {
      const turmaResult = await pool.query(
        "SELECT tipo_data FROM turmas WHERE id = $1",
        [turma_id]
      );
      if (turmaResult.rows.length === 0) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }
      const { tipo_data } = turmaResult.rows[0];

      if (tipo_data === "Data unica") {
        query += ` WHERE c.turma_id = $1 ORDER BY c.criado_em DESC`;
        const result = await pool.query(query, [turma_id]);
        return res.status(200).json(result.rows);
      } else {
        query += ` WHERE c.turma_id = $1 AND c.criado_em::date = CURRENT_DATE ORDER BY c.criado_em DESC`;
        const result = await pool.query(query, [turma_id]);
        return res.status(200).json(result.rows);
      }
    } else {
      query += ` WHERE c.criado_em::date = CURRENT_DATE ORDER BY c.criado_em DESC`;
      const result = await pool.query(query);
      return res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error("Erro ao buscar checkins:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Criar checkin filtrando apenas se ja existe um checkin criado na mesma data para a turma
app.post("/checkin", async (req, res) => {
  try {
    const { user_id, nome, turma_id, criado_em, checkinstatus } = req.body;
    const criadoEm = new Date(criado_em).toISOString().split("T")[0];

    // Verificar se a turma já tem um checkin na mesma data
    const checkinTurmaMesmaData = await pool.query(
      "SELECT * FROM checkins WHERE user_id = $1 AND turma_id = $2 AND DATE(criado_em) = $3::date",
      [user_id, turma_id, criadoEm]
    );

    if (checkinTurmaMesmaData.rows.length > 0) {
      return res.status(400).json({
        message: "Já existe um checkin para essa turma na mesma data",
      });
    }

    // Criar o novo checkin
    const result = await pool.query(
      "INSERT INTO checkins (user_id, nome, turma_id, criado_em, checkinstatus) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id, nome, turma_id, criado_em, checkinstatus]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar checkin:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// pegar todos checkins de um usuario
app.get("/checkins/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query(
      "SELECT * FROM checkins WHERE user_id = $1 ORDER BY criado_em DESC",
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar checkins:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Atualizar status
app.put("/checkins/:id", async (req, res) => {
  const checkinId = req.params.id;
  const { checkinstatus } = req.body;

  if (!checkinstatus) {
    return res.status(400).json({ message: "Status do check-in ausente" });
  }

  try {
    const result = await pool.query(
      `UPDATE checkins SET checkinstatus = $1 WHERE id = $2 RETURNING *`,
      [checkinstatus, checkinId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Check-in não encontrado" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao confirmar check-in:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Deletar checkin
app.delete("/checkins/:id", async (req, res) => {
  const checkinId = req.params.id;
  try {
    const result = await pool.query("DELETE FROM checkins WHERE id = $1", [
      checkinId,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Check-in nao encontrado" });
    }
    return res.status(200).json({ message: "Check-in deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar check-in:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

//#endregion
