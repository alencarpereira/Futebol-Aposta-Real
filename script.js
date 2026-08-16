// ======================================
// CAPTURA DOS DADOS
// ======================================

function obterJogosTime(prefixo) {
    const jogos = [];
    for (let i = 1; i <= 5; i++) {
        jogos.push({
            marcou: Number(document.getElementById(`${prefixo}_m${i}`)?.value) || 0,
            sofreu: Number(document.getElementById(`${prefixo}_s${i}`)?.value) || 0
        });
    }
    return jogos;
}

function obterH2H() {
    const jogos = [];
    for (let i = 1; i <= 5; i++) {
        jogos.push({
            golsA: Number(document.getElementById(`h_a${i}`)?.value) || 0,
            golsB: Number(document.getElementById(`h_b${i}`)?.value) || 0
        });
    }
    return jogos;
}

// ======================================
// ESTATÍSTICAS COM PESO
// ======================================

function calcularEstatisticas(jogos) {
    const pesos = [5, 4, 3, 2, 1];
    let pontos = 0;
    let golsMarcados = 0;
    let golsSofridos = 0;
    let btts = 0;
    let over25 = 0;
    let empates = 0;
    let pesoTotal = 0;

    jogos.forEach((jogo, index) => {
        const peso = pesos[index];
        pesoTotal += peso;

        golsMarcados += jogo.marcou * peso;
        golsSofridos += jogo.sofreu * peso;

        if (jogo.marcou > jogo.sofreu) pontos += 3 * peso;
        if (jogo.marcou === jogo.sofreu) {
            pontos += 1 * peso;
            empates++;
        }

        if (jogo.marcou > 0 && jogo.sofreu > 0) btts++;
        if ((jogo.marcou + jogo.sofreu) > 2) over25++;
    });

    return {
        forma: (pontos / (pesoTotal * 3)) * 100,
        mediaMarcados: golsMarcados / pesoTotal,
        mediaSofridos: golsSofridos / pesoTotal,
        taxaEmpate: (empates / jogos.length) * 100,
        btts: (btts / jogos.length) * 100,
        over25: (over25 / jogos.length) * 100
    };
}

// ======================================
// ESTATÍSTICAS H2H
// ======================================

function calcularH2H(h2h) {
    let venceuA = 0;
    let venceuB = 0;
    let empates = 0;
    let btts = 0;
    let over25 = 0;

    h2h.forEach(jogo => {
        if (jogo.golsA > jogo.golsB) venceuA++;
        else if (jogo.golsB > jogo.golsA) venceuB++;
        else empates++;

        if (jogo.golsA > 0 && jogo.golsB > 0) btts++;
        if ((jogo.golsA + jogo.golsB) > 2) over25++;
    });

    return {
        vitoriaA: (venceuA / 5) * 100,
        vitoriaB: (venceuB / 5) * 100,
        empate: (empates / 5) * 100,
        btts: (btts / 5) * 100,
        over25: (over25 / 5) * 100
    };
}

// ======================================
// VITÓRIA TIME A E TIME B
// ======================================

function calcularVitoriaTimeA(timeA, timeB, h2h) {
    const forcaA =
        (timeA.forma * 0.40) +
        (timeA.mediaMarcados * 20 * 0.25) +
        ((3 - timeA.mediaSofridos) * 20 * 0.15) +
        (h2h.vitoriaA * 0.20);

    const forcaB =
        (timeB.forma * 0.40) +
        (timeB.mediaMarcados * 20 * 0.25) +
        ((3 - timeB.mediaSofridos) * 20 * 0.15) +
        (h2h.vitoriaB * 0.20);

    return Math.round((forcaA / (forcaA + forcaB)) * 100);
}

function calcularVitoriaTimeB(timeA, timeB, h2h) {
    const forcaA =
        (timeA.forma * 0.40) +
        (timeA.mediaMarcados * 20 * 0.25) +
        ((3 - timeA.mediaSofridos) * 20 * 0.15) +
        (h2h.vitoriaA * 0.20);

    const fatorFiltroDefesaA = Math.max(0.70, 1 - (3 - timeA.mediaSofridos) * 0.10);

    const forcaBrutaB = (
        (timeB.forma * 0.40) +
        (timeB.mediaMarcados * 20 * 0.25) +
        ((3 - timeB.mediaSofridos) * 20 * 0.15) +
        (h2h.vitoriaB * 0.20)
    );

    const forcaB = forcaBrutaB * 0.80 * fatorFiltroDefesaA;

    return Math.round((forcaB / (forcaA + forcaB)) * 100);
}

// ======================================
// MERCADOS DE GOLS
// ======================================

function calcularBTTS(timeA, timeB, h2h) {
    // 1. Novo balanceamento: H2H passa a ter 50% do peso
    let probabilidade =
        (timeA.btts * 0.25) +
        (timeB.btts * 0.25) +
        (h2h.btts * 0.50);

    // 2. Bônus de ataque duplo
    if (timeA.mediaMarcados >= 1.5 && timeB.mediaMarcados >= 1.5) {
        probabilidade += 5;
    }

    // 3. TRAVA DA DEFESA SÓLIDA (Anti-1x0 / Anti-0x0)
    // Se qualquer um dos dois times defender muito bem (sofrer menos de 0.8 gol/jogo), penaliza o BTTS
    if (timeA.mediaSofridos < 0.8 || timeB.mediaSofridos < 0.8) {
        probabilidade -= 15;
    }

    return Math.min(Math.round(probabilidade), 95);
}

function calcularOver25(timeA, timeB, h2h) {
    let mediaA = (timeA.mediaMarcados + timeA.mediaSofridos) * 20;
    let mediaB = (timeB.mediaMarcados + timeB.mediaSofridos) * 20;

    let score = (mediaA * 0.35) + (mediaB * 0.35) + (h2h.over25 * 0.30);

    return Math.round(Math.max(0, Math.min(100, score)));
}

function escolherMelhorAposta(lista) {
    if (!lista || lista.length === 0) return { nome: "Nenhuma", probabilidade: 0 };
    let melhor = lista[0];
    lista.forEach(item => {
        if (item.probabilidade > melhor.probabilidade) {
            melhor = item;
        }
    });
    return melhor;
}

function aplicarAjusteCompeticao(btts, over25, probEmpate, tipoCompeticao) {
    let bttsAjustado = btts;
    let over25Ajustado = over25;
    let empateAjustado = probEmpate;

    if (tipoCompeticao === "matamata") {
        bttsAjustado = Math.round(btts * 0.88);
        over25Ajustado = Math.round(over25 * 0.85);
        empateAjustado = Math.round(probEmpate * 1.15);
    } else {
        bttsAjustado = Math.min(95, Math.round(btts * 1.05));
        over25Ajustado = Math.min(95, Math.round(over25 * 1.05));
    }

    return {
        btts: bttsAjustado,
        over25: over25Ajustado,
        empate: empateAjustado
    };
}

function analisarPartida() {
    const tipoCompeticao = document.getElementById("tipoCompeticao")?.value || "liga";

    const jogosA = obterJogosTime("a");
    const jogosB = obterJogosTime("b");
    const h2hJogos = obterH2H();

    const timeA = calcularEstatisticas(jogosA);
    const timeB = calcularEstatisticas(jogosB);
    const h2h = calcularH2H(h2hJogos);

    const vitoriaA = calcularVitoriaTimeA(timeA, timeB, h2h);
    const vitoriaB = calcularVitoriaTimeB(timeA, timeB, h2h);

    let btts = calcularBTTS(timeA, timeB, h2h);
    let over25 = calcularOver25(timeA, timeB, h2h);

    const taxaEmpateConfronto = (timeA.taxaEmpate + timeB.taxaEmpate + h2h.empate) / 3;

    const ajustes = aplicarAjusteCompeticao(btts, over25, taxaEmpateConfronto, tipoCompeticao);
    btts = ajustes.btts;
    over25 = ajustes.over25;

    const mercados = [
        { nome: "Ambos Marcam", probabilidade: btts },
        { nome: "Over 2.5 Gols", probabilidade: over25 }
    ];

    // --- REGRA COM FILTRO H2H PARA O TIME A (MANDANTE) ---
    if (vitoriaA >= 65) {
        if (h2h.vitoriaA < 40) {
            // Se o H2H for fraco (<40%), rebaixa a Vitória Seca para DNB
            const probDNB_A = Math.min(88, Math.round(vitoriaA + (taxaEmpateConfronto * 0.5)));
            mercados.push({ nome: "Empate Anula - Time A", probabilidade: probDNB_A });
        } else {
            mercados.push({ nome: "Vitória Time A", probabilidade: vitoriaA });
        }
    } else if (vitoriaA >= 50) {
        const probDNB_A = Math.min(88, Math.round(vitoriaA + (taxaEmpateConfronto * 0.5)));
        mercados.push({ nome: "Empate Anula - Time A", probabilidade: probDNB_A });
    }

    // --- REGRA REFINADA PARA O TIME B (VISITANTE) ---
    if (vitoriaB >= 65) {
        mercados.push({ nome: "Vitória Time B", probabilidade: vitoriaB });
    } else if (vitoriaB >= 50) {
        const probDNB_B = Math.min(88, Math.round(vitoriaB + (taxaEmpateConfronto * 0.5)));
        mercados.push({ nome: "Empate Anula - Time B", probabilidade: probDNB_B });
    }

    // AGORA SIM: Escolhe a melhor aposta com TODOS os mercados validados
    const melhor = escolherMelhorAposta(mercados);
    const motivos = gerarMotivos(melhor.nome, timeA, timeB, h2h);
    const resultado = document.getElementById("resultado");

    if (melhor.probabilidade < 60) {
        resultado.innerHTML = `
            <h3>⚠️ Sem entrada recomendada</h3>
            <p>Maior confiança: ${melhor.probabilidade}%</p>
        `;
        return;
    }

    resultado.innerHTML = `
        <div class="resultado-top">
            <strong>🔥 ${melhor.nome}</strong>
            <span class="probabilidade">${melhor.probabilidade}%</span>
        </div>

        <div class="motivos-box">
            <h3>Motivos</h3>
            <ul>
                ${motivos.length > 0
            ? motivos.map(m => `<li>${m}</li>`).join("")
            : "<li>✓ Dados estatísticos favoráveis para este mercado.</li>"
        }
            </ul>
        </div>

        <div class="cards">
            <div class="card"><span>Vitória A</span><strong>${vitoriaA}%</strong></div>
            <div class="card"><span>Vitória B</span><strong>${vitoriaB}%</strong></div>
            <div class="card"><span>BTTS</span><strong>${btts}%</strong></div>
            <div class="card"><span>Over 2.5</span><strong>${over25}%</strong></div>
        </div>
    `;
}

// ======================================
// ANÁLISE EXCLUSIVA H2H (DNB AMBOS)
// ======================================

function analisarApenasH2H() {
    const tipoCompeticao = document.getElementById("tipoCompeticao")?.value || "liga";

    const h2hJogos = obterH2H();
    const h2h = calcularH2H(h2hJogos);
    const taxaEmpateH2H = h2h.empate;

    let bttsH2H = Math.round(h2h.btts);
    let over25H2H = Math.round(h2h.over25);

    const ajustes = aplicarAjusteCompeticao(bttsH2H, over25H2H, taxaEmpateH2H, tipoCompeticao);
    bttsH2H = ajustes.btts;
    over25H2H = ajustes.over25;

    const forcaH2H_A = h2h.vitoriaA;
    const forcaH2H_B = h2h.vitoriaB * 0.80;

    const totalForca = forcaH2H_A + forcaH2H_B;
    const probVitA = totalForca > 0 ? Math.round((forcaH2H_A / totalForca) * 100) : 0;
    const probVitB = totalForca > 0 ? Math.round((forcaH2H_B / totalForca) * 100) : 0;

    const mercadosH2H = [
        { nome: "Ambos Marcam (H2H)", probabilidade: bttsH2H },
        { nome: "Over 2.5 Gols (H2H)", probabilidade: over25H2H }
    ];

    // REGRA DNB TIME A NO H2H (COM FILTRO DE SEGURANÇA)
    if (probVitA >= 65) {
        if (h2h.vitoriaA < 40) {
            // Se o histórico real for fraco (<40%), protege com DNB
            const probDNB_A = Math.min(88, Math.round(probVitA + (taxaEmpateH2H * 0.5)));
            mercadosH2H.push({ nome: "Empate Anula - Time A (H2H)", probabilidade: probDNB_A });
        } else {
            mercadosH2H.push({ nome: "Vitória Time A (H2H)", probabilidade: probVitA });
        }
    } else if (probVitA >= 50) {
        const probDNB_A = Math.min(88, Math.round(probVitA + (taxaEmpateH2H * 0.5)));
        mercadosH2H.push({ nome: "Empate Anula - Time A (H2H)", probabilidade: probDNB_A });
    }

    const melhorH2H = escolherMelhorAposta(mercadosH2H);
    const resultado = document.getElementById("resultado");

    if (melhorH2H.probabilidade < 60) {
        resultado.innerHTML = `
            <h3>⚠️ H2H inconclusivo (Sem entrada recomendada)</h3>
            <p>Maior confiança encontrada no H2H: ${melhorH2H.probabilidade}%</p>
        `;
        return;
    }

    resultado.innerHTML = `
        <div class="resultado-top">
            <strong>⚔️ Sugestão via H2H: ${melhorH2H.nome}</strong>
            <span class="probabilidade">${melhorH2H.probabilidade}%</span>
        </div>

        <div class="cards">
            <div class="card"><span>Vitória A (H2H)</span><strong>${probVitA}%</strong></div>
            <div class="card"><span>Vitória B (H2H)</span><strong>${probVitB}%</strong></div>
            <div class="card"><span>BTTS (H2H)</span><strong>${bttsH2H}%</strong></div>
            <div class="card"><span>Over 2.5 (H2H)</span><strong>${over25H2H}%</strong></div>
            <div class="card"><span>Empates (H2H)</span><strong>${Math.round(h2h.empate)}%</strong></div>
        </div>
    `;
}

// ======================================
// GERADOR DE MOTIVOS
// ======================================

function gerarMotivos(mercado, timeA, timeB, h2h) {
    const motivos = [];

    if (mercado === "Ambos Marcam" || mercado === "Ambos Marcam (H2H)") {
        if (timeA.btts >= 60) motivos.push(`✓ Time A teve BTTS em ${Math.round(timeA.btts)}% dos jogos`);
        if (timeB.btts >= 60) motivos.push(`✓ Time B teve BTTS em ${Math.round(timeB.btts)}% dos jogos`);
        if (h2h.btts >= 60) motivos.push(`✓ H2H teve BTTS em ${Math.round(h2h.btts)}% dos confrontos`);
        if (timeA.mediaMarcados >= 1) motivos.push(`✓ Time A marcou média de ${timeA.mediaMarcados.toFixed(1)} gols`);
        if (timeB.mediaMarcados >= 1) motivos.push(`✓ Time B marcou média de ${timeB.mediaMarcados.toFixed(1)} gols`);
    }

    if (mercado === "Over 2.5 Gols" || mercado === "Over 2.5 Gols (H2H)") {
        if (timeA.over25 >= 60) motivos.push(`✓ Time A teve Over 2.5 em ${Math.round(timeA.over25)}% dos jogos`);
        if (timeB.over25 >= 60) motivos.push(`✓ Time B teve Over 2.5 em ${Math.round(timeB.over25)}% dos jogos`);
        if (h2h.over25 >= 60) motivos.push(`✓ H2H teve Over 2.5 em ${Math.round(h2h.over25)}% dos confrontos`);
    }

    if (mercado === "Vitória Time A" || mercado === "Empate Anula - Time A" || mercado === "Vitória Time A (H2H)" || mercado === "Empate Anula - Time A (H2H)") {
        if (mercado.includes("Empate Anula")) motivos.push(`🛡️ Entrada protegida em caso de empate (DNB)`);
        if (timeA.forma > timeB.forma) motivos.push(`✓ Time A possui melhor forma recente`);
        if (timeA.mediaMarcados > timeB.mediaMarcados) motivos.push(`✓ Time A possui ataque mais eficiente`);
        if (timeA.mediaSofridos < timeB.mediaSofridos) motivos.push(`✓ Time A possui defesa mais sólida`);
        if (h2h.vitoriaA > h2h.vitoriaB) motivos.push(`✓ Time A leva vantagem nos confrontos diretos`);
    }

    if (mercado === "Vitória Time B" || mercado === "Empate Anula - Time B" || mercado === "Vitória Time B (H2H)" || mercado === "Empate Anula - Time B (H2H)") {
        if (mercado.includes("Empate Anula")) motivos.push(`🛡️ Entrada protegida em caso de empate (DNB)`);
        if (timeB.forma > timeA.forma) motivos.push(`✓ Time B possui melhor forma recente`);
        if (timeB.mediaMarcados > timeA.mediaMarcados) motivos.push(`✓ Time B possui ataque mais eficiente`);
        if (timeB.mediaSofridos < timeA.mediaSofridos) motivos.push(`✓ Time B possui defesa mais sólida`);
        if (h2h.vitoriaB > h2h.vitoriaA) motivos.push(`✓ Time B leva vantagem nos confrontos diretos`);
    }

    return motivos;
}


// ======================================
// PREENCHER EXEMPLO
// ======================================

function preencherExemplo() {

    document.getElementById("timeA").value = "Flamengo";
    document.getElementById("timeB").value = "Palmeiras";

    // Time A

    document.getElementById("a_m1").value = 3;
    document.getElementById("a_s1").value = 1;

    document.getElementById("a_m2").value = 2;
    document.getElementById("a_s2").value = 1;

    document.getElementById("a_m3").value = 1;
    document.getElementById("a_s3").value = 1;

    document.getElementById("a_m4").value = 2;
    document.getElementById("a_s4").value = 0;

    document.getElementById("a_m5").value = 1;
    document.getElementById("a_s5").value = 0;


    // Time B

    document.getElementById("b_m1").value = 2;
    document.getElementById("b_s1").value = 2;

    document.getElementById("b_m2").value = 1;
    document.getElementById("b_s2").value = 2;

    document.getElementById("b_m3").value = 3;
    document.getElementById("b_s3").value = 1;

    document.getElementById("b_m4").value = 1;
    document.getElementById("b_s4").value = 1;

    document.getElementById("b_m5").value = 0;
    document.getElementById("b_s5").value = 1;


    // H2H

    document.getElementById("h_a1").value = 2;
    document.getElementById("h_b1").value = 1;

    document.getElementById("h_a2").value = 1;
    document.getElementById("h_b2").value = 1;

    document.getElementById("h_a3").value = 3;
    document.getElementById("h_b3").value = 2;

    document.getElementById("h_a4").value = 2;
    document.getElementById("h_b4").value = 2;

    document.getElementById("h_a5").value = 1;
    document.getElementById("h_b5").value = 0;

}

// ======================================
// LIMPAR FORMULÁRIO
// ======================================

function limparFormulario() {

    // Limpa todos os inputs
    document
        .querySelectorAll("input")
        .forEach(input => {
            input.value = "";
        });

    // Limpa resultado
    document.getElementById("resultado").innerHTML = `
        <p>Aguardando análise...</p>
    `;

}

// ======================================
// EVENTO BOTÃO
// ======================================

document
    .getElementById("analisarBtn")
    .addEventListener(
        "click",
        analisarPartida
    );

document
    .getElementById("testeBtn")
    .addEventListener(
        "click",
        preencherExemplo
    );

document
    .getElementById("limparBtn")
    .addEventListener(
        "click",
        limparFormulario
    );