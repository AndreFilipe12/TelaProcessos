db = db.getSiblingDB('sistema');

// Criar coleção de usuários se não existir
db.createCollection('usuarios');

// Inserir usuário admin padrão
db.usuarios.insertOne({
    usuario: "admin",
    senha: "123456"  // Em produção, use hash!
});

// Criar coleção de processos
db.createCollection('processos');

print('✅ Banco de dados inicializado com usuário admin');