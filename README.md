# SEMIT - Sistema de Acompanhimento de Processos

Sistema web para gerenciamento de processos administrativos da Secretaria de Inovação e Tecnologia (SEMIT). Permite cadastrar, listar, editar, excluir e buscar processos, com autenticação segura, paginação e interface responsiva.

## 🚀 Tecnologias

- **Backend:** Node.js, Express
- **Banco de Dados:** MongoDB (com bcrypt para hash de senhas)
- **Frontend:** HTML5, CSS3, JavaScript (ES6)
- **Containerização:** Docker, Docker Compose
- **Ferramentas Auxiliares:** Mongo Express (interface web para o banco)

## ✨ Funcionalidades

- ✅ Autenticação de usuários (senhas criptografadas com bcrypt)
- ✅ Listagem de processos com **busca em tempo real**
- ✅ **CRUD completo** (criar, ler, atualizar, deletar)
- ✅ Edição apenas da descrição (via prompt)
- ✅ **Cálculo automático do tempo** desde a última atualização
- ✅ Status coloridos (Urgente, Em andamento, Aguardando, Finalizado)
- ✅ Interface responsiva e amigável
- ✅ Containerização com Docker (pronto para deploy)

## 🐳 Como Executar com Docker

### Pré-requisitos
- Docker e Docker Compose instalados

### Passos
1. Clone o repositório:
   ```bash
   git clone https://github.com/AndreFilipe12/TelaProcessos.git
   cd TelaProcessos
