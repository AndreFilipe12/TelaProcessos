require('dotenv').config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express(); // ✅ FALTAVA ISSO

// 🔥 URI (usa .env ou fallback)
const uri = process.env.MONGODB_URI || "mongodb+srv://andrereis_db_user:Filipe2026Atlas@cluster0.yglzaw0.mongodb.net/sistema";

// Debug (pode remover depois)
console.log("URI:", uri);

// Middlewares
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const client = new MongoClient(uri);

let db;

async function conectar() {
    try {
        await client.connect();
        db = client.db("sistema");
        console.log("✅ MongoDB conectado!");
        
        // Admin padrão
        const admin = await db.collection("usuarios").findOne({ usuario: "admin" });
        if (!admin) {
            const senhaHash = await bcrypt.hash("123456", 10);
            await db.collection("usuarios").insertOne({
                usuario: "admin",
                senha: senhaHash,
                criadoEm: new Date()
            });
            console.log("✅ Admin criado (123456)");
        }
    } catch (erro) {
        console.error("❌ Erro MongoDB:", erro.message);
    }
}
conectar();

// Rota inicial
app.get("/", (req, res) => {
    res.redirect("/pages/login.html");
});

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
        res.status(500).json({ erro: erro.message });
    }
});

// PROCESSOS
app.get("/processos", async (req, res) => {
    const processos = await db.collection("processos").find().toArray();
    res.json(processos);
});

app.post("/processos", async (req, res) => {
    await db.collection("processos").insertOne(req.body);
    res.json({ sucesso: true });
});

app.delete("/processos/:id", async (req, res) => {
    const resultado = await db.collection("processos").deleteOne({
        _id: new ObjectId(req.params.id)
    });
    res.json({ sucesso: resultado.deletedCount > 0 });
});

app.put("/processos/:id", async (req, res) => {
    const resultado = await db.collection("processos").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
    );
    res.json({ sucesso: resultado.matchedCount > 0 });
});

// Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});