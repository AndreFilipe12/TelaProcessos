const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect("/pages/login.html");
});

const uri = process.env.MONGODB_URI || "mongodb://mongodb:27017/sistema";
const client = new MongoClient(uri);

let db;

async function conectar() {
    try {
        await client.connect();
        db = client.db("sistema");
        console.log("✅ MongoDB conectado");
        
        const admin = await db.collection("usuarios").findOne({ usuario: "admin" });
        if (!admin) {
            const senhaHash = await bcrypt.hash("123456", 10);
            await db.collection("usuarios").insertOne({
                usuario: "admin",
                senha: senhaHash,
                criadoEm: new Date()
            });
            console.log("✅ Usuário admin criado com hash");
        }
        
    } catch (erro) {
        console.error("❌ Erro ao conectar MongoDB:", erro.message);
    }
}

conectar();

// LOGIN
app.post("/login", async (req, res) => {
    try {
        const { usuario, senha } = req.body;
        const user = await db.collection("usuarios").findOne({ usuario });
        
        if (user && await bcrypt.compare(senha, user.senha)) {
            res.json({ sucesso: true });
        } else {
            res.json({ sucesso: false });
        }
    } catch (erro) {
        res.json({ sucesso: false, erro: erro.message });
    }
});

// CRIAR USUÁRIO
app.post("/usuarios", async (req, res) => {
    try {
        const { usuario, senha } = req.body;
        
        if (!usuario || !senha) {
            return res.status(400).json({ erro: "Usuário e senha obrigatórios" });
        }
        
        const existe = await db.collection("usuarios").findOne({ usuario });
        if (existe) {
            return res.status(400).json({ erro: "Usuário já existe" });
        }
        
        const senhaHash = await bcrypt.hash(senha, 10);
        
        await db.collection("usuarios").insertOne({
            usuario,
            senha: senhaHash,
            criadoEm: new Date()
        });
        
        res.status(201).json({ sucesso: true });
        
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ===== NOVA ROTA DE ALTERAR SENHA (CORRIGIDA) =====
app.post("/usuarios/alterar-senha", async (req, res) => {
    try {
        const { usuario, novaSenha } = req.body;
        
        console.log("🔵 Recebida requisição para alterar senha:", { usuario });
        
        if (!usuario || !novaSenha) {
            console.log("🔴 Erro: Campos obrigatórios faltando");
            return res.status(400).json({ erro: "Usuário e nova senha obrigatórios" });
        }
        
        // Verificar se usuário existe
        const user = await db.collection("usuarios").findOne({ usuario });
        if (!user) {
            console.log("🔴 Erro: Usuário não encontrado:", usuario);
            return res.status(404).json({ erro: "Usuário não encontrado" });
        }
        
        // Gerar hash da nova senha
        console.log("🟡 Gerando hash para nova senha...");
        const senhaHash = await bcrypt.hash(novaSenha, 10);
        
        // Atualizar no banco
        await db.collection("usuarios").updateOne(
            { usuario },
            { $set: { senha: senhaHash, atualizadoEm: new Date() } }
        );
        
        console.log("✅ Senha alterada com sucesso para:", usuario);
        res.json({ sucesso: true, mensagem: "Senha alterada com sucesso!" });
        
    } catch (erro) {
        console.error("🔴 Erro ao alterar senha:", erro);
        res.status(500).json({ erro: erro.message });
    }
});

// LISTAR USUÁRIOS
app.get("/usuarios", async (req, res) => {
    try {
        const usuarios = await db.collection("usuarios").find().toArray();
        const usuariosSemSenha = usuarios.map(u => ({
            _id: u._id,
            usuario: u.usuario,
            criadoEm: u.criadoEm
        }));
        res.json(usuariosSemSenha);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ROTAS DE PROCESSOS
app.get("/processos", async (req, res) => {
    try {
        const processos = await db.collection("processos").find().toArray();
        res.json(processos);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

app.get("/processos/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const processo = await db.collection("processos").findOne({
            _id: new ObjectId(id)
        });
        
        if (processo) {
            res.json(processo);
        } else {
            res.status(404).json({ erro: "Processo não encontrado" });
        }
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

app.post("/processos", async (req, res) => {
    try {
        const processo = req.body;
        await db.collection("processos").insertOne(processo);
        res.status(201).json({ sucesso: true });
    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

app.delete("/processos/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const resultado = await db.collection("processos").deleteOne({
            _id: new ObjectId(id)
        });
        
        if (resultado.deletedCount === 0) {
            return res.status(404).json({ erro: "Processo não encontrado" });
        }
        
        res.json({ sucesso: true });
    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

app.put("/processos/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const dados = req.body;
        
        const resultado = await db.collection("processos").updateOne(
            { _id: new ObjectId(id) },
            { $set: dados }
        );
        
        if (resultado.matchedCount === 0) {
            return res.status(404).json({ erro: "Processo não encontrado" });
        }
        
        res.json({ sucesso: true });
    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

app.listen(3000, () => {
    console.log("🚀 Servidor rodando em http://localhost:3000");
});