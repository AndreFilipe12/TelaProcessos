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

// Login
async function login() {
    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    try {
        const resposta = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, senha })
        });

        const dados = await resposta.json();

        if (dados.sucesso) {
            window.location.href = "/pages/processos.html";
        } else {
            alert("Usuário ou senha inválidos");
        }
    } catch (erro) {
        alert("Erro ao conectar ao servidor");
    }
}

// ADICIONAR PROCESSO VIA PROMPT
async function adicionarProcessoPrompt() {
    const numero = prompt("📌 Número do processo (ex: 001/2024):");
    if (!numero) return;
    
    const descricao = prompt("📝 Descrição do processo:");
    if (!descricao) return;
    
    const status = prompt("⚡ Status (Aguardando aprovação, Em andamento, Urgente, Finalizado):", "Em andamento");
    if (!status) return;
    
    const procedencia = prompt("📤 Procedência (Origem):");
    if (!procedencia) return;
    
    const destino = prompt("📥 Destino:");
    if (!destino) return;
    
    // Data atual no formato DD/MM/YYYY
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataAtualizacao = `${dia}/${mes}/${ano}`;
    
    const processo = {
        numero: numero.trim(),
        descricao: descricao.trim(),
        status: status.trim(),
        procedencia: procedencia.trim(),
        destino: destino.trim(),
        dataAtualizacao: dataAtualizacao
    };
    
    try {
        const resposta = await fetch("/processos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(processo)
        });
        
        if (resposta.ok) {
            alert("✅ Processo adicionado com sucesso!");
            const buscaInput = document.getElementById("buscaProcesso");
            await carregarProcessos(buscaInput ? buscaInput.value : "");
        } else {
            alert("❌ Erro ao adicionar processo");
        }
    } catch (erro) {
        console.error("Erro:", erro);
        alert("❌ Erro ao conectar ao servidor");
    }
}

// Carregar processos
async function carregarProcessos(termoBusca = "") {
    try {
        const resposta = await fetch("/processos");
        let processos = await resposta.json();

        const tabela = document.getElementById("tabela-corpo");
        if (!tabela) return;

        // Aplicar filtro de busca
        if (termoBusca.trim() !== "") {
            const termo = termoBusca.toLowerCase().trim();
            processos = processos.filter(proc => {
                return (
                    (proc.numero && proc.numero.toLowerCase().includes(termo)) ||
                    (proc.descricao && proc.descricao.toLowerCase().includes(termo)) ||
                    (proc.status && proc.status.toLowerCase().includes(termo)) ||
                    (proc.procedencia && proc.procedencia.toLowerCase().includes(termo)) ||
                    (proc.destino && proc.destino.toLowerCase().includes(termo))
                );
            });
        }

        if (processos.length === 0) {
            tabela.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #7f8c8d;">Nenhum processo encontrado</td></tr>`;
            return;
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
                    <button onclick="editarDescricao('${proc._id}', '${proc.descricao ? proc.descricao.replace(/'/g, "\\'") : ""}')" class="btn-edit" title="Editar apenas descrição">✏️</button>
                    <button onclick="deletarProcesso('${proc._id}')" class="btn-delete" title="Excluir processo">🗑️</button>
                </td>
            `;
            
            tabela.appendChild(linha);
        });

    } catch (erro) {
        console.error("Erro ao carregar processos:", erro);
        const tabela = document.getElementById("tabela-corpo");
        if (tabela) {
            tabela.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #c62828; padding: 40px;">Erro ao carregar processos. Verifique o servidor.</td></tr>`;
        }
    }
}

// EDITAR APENAS DESCRIÇÃO VIA PROMPT
async function editarDescricao(id, descricaoAtual) {
    const novaDescricao = prompt("✏️ Editar descrição do processo:", descricaoAtual);
    
    if (novaDescricao === null) return;
    
    if (novaDescricao.trim() === "") {
        alert("❌ A descrição não pode ficar vazia");
        return;
    }
    
    if (novaDescricao.trim() === descricaoAtual) {
        alert("ℹ️ Nenhuma alteração foi feita");
        return;
    }
    
    try {
        const resposta = await fetch("/processos/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                descricao: novaDescricao.trim() 
            })
        });
        
        if (resposta.ok) {
            alert("✅ Descrição atualizada com sucesso!");
            const buscaInput = document.getElementById("buscaProcesso");
            await carregarProcessos(buscaInput ? buscaInput.value : "");
        } else {
            alert("❌ Erro ao atualizar descrição");
        }
        
    } catch (erro) {
        console.error("Erro ao editar:", erro);
        alert("❌ Erro ao conectar ao servidor");
    }
}

// Deletar processo
async function deletarProcesso(id) {
    if (!confirm("🗑️ Tem certeza que deseja excluir este processo?")) return;

    try {
        const resposta = await fetch("/processos/" + id, {
            method: "DELETE"
        });
        
        if (resposta.ok) {
            alert("✅ Processo excluído com sucesso!");
            const buscaInput = document.getElementById("buscaProcesso");
            await carregarProcessos(buscaInput ? buscaInput.value : "");
        } else {
            alert("❌ Erro ao excluir processo");
        }
    } catch (erro) {
        console.error("Erro:", erro);
        alert("❌ Erro ao conectar ao servidor");
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    const tabela = document.getElementById("tabela-corpo");
    const buscaInput = document.getElementById("buscaProcesso");
    
    if (tabela) {
        carregarProcessos();
    }
    
    if (buscaInput) {
        let timeoutId;
        buscaInput.addEventListener("input", (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                carregarProcessos(e.target.value);
            }, 300);
        });
    }
});