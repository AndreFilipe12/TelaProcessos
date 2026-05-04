// ========== FUNÇÕES DE UTILIDADE ==========

// Formatar data do banco para exibição
function formatarDataExibicao(data) {
    if (!data) return "-";
    if (data.includes('/')) return data;
    if (data.includes('-')) {
        const [ano, mes, dia] = data.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
    }
    return data;
}

// Calcular tempo desde a atualização
function calcularTempo(dataAtualizacao) {
    if (!dataAtualizacao) return "N/A";
    
    try {
        let dataProc;
        if (dataAtualizacao.includes('/')) {
            const partes = dataAtualizacao.split('/');
            dataProc = new Date(partes[2], partes[1] - 1, partes[0]);
        } else {
            dataProc = new Date(dataAtualizacao);
        }
        
        const hoje = new Date();
        const diffMs = hoje - dataProc;
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffDias < 0) return "Data futura";
        if (diffDias === 0) return `${diffHoras} horas`;
        if (diffDias === 1) return "1 dia";
        if (diffDias < 30) return `${diffDias} dias`;
        if (diffDias < 365) return `${Math.floor(diffDias / 30)} meses`;
        return `${Math.floor(diffDias / 365)} ano(s)`;
    } catch (e) {
        return "Data inválida";
    }
}

// Definir classe CSS baseada no status
function getStatusClass(status) {
    if (!status) return "status-outros";
    status = status.toLowerCase();
    
    if (status.includes("urgente")) return "status-urgente";
    if (status.includes("aguardando")) return "status-aguardando";
    if (status.includes("andamento")) return "status-andamento";
    if (status.includes("finalizado") || status.includes("concluído")) return "status-finalizado";
    
    return "status-outros";
}

// ========== FUNÇÕES CRUD ==========

// Login corrigido
async function login() {
    const usuarioCampo = document.getElementById("usuario");
    const senhaCampo = document.getElementById("senha");

    if (!usuarioCampo || !senhaCampo) {
        console.error("Erro: IDs 'usuario' ou 'senha' não encontrados no HTML.");
        return;
    }

    const usuario = usuarioCampo.value;
    const senha = senhaCampo.value;

    try {
        const resposta = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, senha })
        });

        const dados = await resposta.json();

        if (dados.sucesso) {
            console.log("✅ Login realizado com sucesso!");
            window.location.href = "/pages/processos.html";
        } else {
            alert("❌ Usuário ou senha incorretos!");
        }
    } catch (erro) {
        console.error("Erro ao conectar:", erro);
        alert("❌ Erro ao conectar ao servidor. Verifique se o backend está rodando.");
    }
}

// Carregar processos
async function carregarProcessos(termoBusca = "") {
    try {
        const resposta = await fetch("/processos");
        let processos = await resposta.json();

        const tabela = document.getElementById("tabela-corpo");
        if (!tabela) return;

        // Filtro de busca
        if (termoBusca.trim() !== "") {
            const termo = termoBusca.toLowerCase().trim();
            processos = processos.filter(proc => {
                return (
                    (proc.numero && proc.numero.toLowerCase().includes(termo)) ||
                    (proc.descricao && proc.descricao.toLowerCase().includes(termo)) ||
                    (proc.status && proc.status.toLowerCase().includes(termo))
                );
            });
        }

        // Ordenar por data (mais recentes primeiro)
        processos.sort((a, b) => {
            const dataA = a.dataAtualizacao ? new Date(a.dataAtualizacao.split('/').reverse().join('-')) : new Date(0);
            const dataB = b.dataAtualizacao ? new Date(b.dataAtualizacao.split('/').reverse().join('-')) : new Date(0);
            return dataB - dataA;
        });

        tabela.innerHTML = "";
        
        processos.forEach(proc => {
            const dataFormatada = formatarDataExibicao(proc.dataAtualizacao);
            const tempo = calcularTempo(dataFormatada);
            const statusClass = getStatusClass(proc.status);
            
            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${proc.numero || "-"}</td>
                <td>${proc.descricao || "-"}</td>
                <td><span class="status-badge ${statusClass}">${proc.status || "-"}</span></td>
                <td>${proc.procedencia || "-"}</td>
                <td>${proc.destino || "-"}</td>
                <td>${dataFormatada}</td>
                <td class="tempo-cell">${tempo}</td>
                <td class="actions-cell">
                    <button onclick="editarDescricao('${proc._id}', '${proc.descricao ? proc.descricao.replace(/'/g, "\\'") : ""}')" class="btn-edit" title="Editar">✏️</button>
                    <button onclick="deletarProcesso('${proc._id}')" class="btn-delete" title="Excluir">🗑️</button>
                </td>
            `;
            tabela.appendChild(linha);
        });

    } catch (erro) {
        console.error("Erro ao carregar:", erro);
    }
}

// Adicionar processo
async function adicionarProcessoPrompt() {
    const numero = prompt("📌 Número do processo:");
    const descricao = prompt("📝 Descrição:");
    const status = prompt("⚡ Status:", "Em andamento");
    const procedencia = prompt("📤 Procedência:");
    const destino = prompt("📥 Destino:");
    
    if (!numero || !descricao) return;

    const hoje = new Date();
    const dataAtualizacao = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
    
    const processo = { numero, descricao, status, procedencia, destino, dataAtualizacao };
    
    try {
        const resposta = await fetch("/processos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(processo)
        });
        
        if (resposta.ok) {
            alert("✅ Adicionado!");
            carregarProcessos();
        }
    } catch (erro) {
        alert("❌ Erro ao salvar");
    }
}

// Deletar processo
async function deletarProcesso(id) {
    if (!confirm("🗑️ Excluir este processo?")) return;

    try {
        const resposta = await fetch("/processos/" + id, { method: "DELETE" });
        if (resposta.ok) carregarProcessos();
    } catch (erro) {
        alert("❌ Erro ao deletar");
    }
}

// Editar descrição
async function editarDescricao(id, descricaoAtual) {
    const novaDescricao = prompt("✏️ Editar descrição:", descricaoAtual);
    if (novaDescricao === null || novaDescricao.trim() === "") return;
    
    try {
        const resposta = await fetch("/processos/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ descricao: novaDescricao.trim() })
        });
        if (resposta.ok) carregarProcessos();
    } catch (erro) {
        alert("❌ Erro ao editar");
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    const tabela = document.getElementById("tabela-corpo");
    const buscaInput = document.getElementById("buscaProcesso");
    
    if (tabela) carregarProcessos();
    
    if (buscaInput) {
        buscaInput.addEventListener("input", (e) => {
            carregarProcessos(e.target.value);
        });
    }
});