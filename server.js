const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Rota inicial - Garante que ao abrir o site, ele vá para o login
app.get("/", (req, res) => {
    res.redirect("/pages/login.html");
});

// Configuração da Conexão (OKD ou Local)
const uri = process.env.MONGODB_URI || "mongodb+srv://andrereis_db_user:SenhaSegura2026@cluster0.yglzaw0.mongodb.net/sistema?retryWrites=true&w=majority";
const client = new MongoClient(uri);

let db;

async function conectar() {
    try {
        await client.connect();
        db = client.db("sistema");
        console.log("✅ MongoDB conectado!");
        
        // Verifica/Cria usuário admin padrão
        const admin = await db.collection("usuarios").findOne({ usuario: "admin" });
        if (!admin) {
            const senhaHash = await bcrypt.hash("123456", 10);
            await db.collection("usuarios").insertOne({
                usuario: "admin",
                senha: senhaHash,
                criadoEm: new Date()
            });
            console.log("✅ Usuário admin padrão (123456) criado com sucesso.");
        }
    } catch (erro) {
        console.error("❌ Erro na conexão MongoDB:", erro.message);
    }
}
conectar();

// === ROTA DE LOGIN ===
app.post("/login", async (req, res) => {
    try {
        const { usuario, senha } = req.body;
        console.log(`📡 Tentativa de login: ${usuario}`);

        const user = await db.collection("usuarios").findOne({ usuario });
        
        if (user && await bcrypt.compare(senha, user.senha)) {
            console.log("✅ Login aprovado!");
            res.json({ sucesso: true });
        } else {
            console.log("❌ Login negado: Usuário ou senha incorretos.");
            res.json({ sucesso: false, mensagem: "Credenciais inválidas" });
        }
    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

// === ROTAS DE PROCESSOS ===
app.get("/processos", async (req, res) => {
    try {
        const processos = await db.collection("processos").find().toArray();
        res.json(processos);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

app.post("/processos", async (req, res) => {
    try {
        await db.collection("processos").insertOne(req.body);
        res.status(201).json({ sucesso: true });
    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

app.delete("/processos/:id", async (req, res) => {
    try {
        const resultado = await db.collection("processos").deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ sucesso: resultado.deletedCount > 0 });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

app.put("/processos/:id", async (req, res) => {
    try {
        const resultado = await db.collection("processos").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );
        res.json({ sucesso: resultado.matchedCount > 0 });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// Porta dinâmica para OKD (8080) ou Local (3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});