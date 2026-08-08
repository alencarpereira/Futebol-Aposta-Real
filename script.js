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
// ESTATÍSTICAS COM PESO (ORIGINAL)
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
// ESTATÍSTICAS H2H (ORIGINAL)
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
// VITÓRIA TIME A (ORIGINAL MANTIDO)
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

// ======================================
// VITÓRIA TIME B (AJUSTADO COM DESCONTO DE MANDO)
// ======================================

function calcularVitoriaTimeB(timeA, timeB, h2h) {

    const forcaA =
        (timeA.forma * 0.40) +
        (timeA.mediaMarcados * 20 * 0.25) +
        ((3 - timeA.mediaSofridos) * 20 * 0.15) +
        (h2h.vitoriaA * 0.20);

    // Multiplica o total da força B por 0.88 (-12%)
    const forcaB = (
        (timeB.forma * 0.40) +
        (timeB.mediaMarcados * 20 * 0.25) +
        ((3 - timeB.mediaSofridos) * 20 * 0.15) +
        (h2h.vitoriaB * 0.20)
    ) * 0.88;

    return Math.round(
        (forcaB / (forcaA + forcaB)) * 100
    );

}

// ======================================
// BTTS (ORIGINAL MANTIDO)
// ======================================

function calcularBTTS(timeA, timeB, h2h) {
    let probabilidade =
        (timeA.btts * 0.35) +
        (timeB.btts * 0.35) +
        (h2h.btts * 0.30);

    if (timeA.mediaMarcados >= 1.5 && timeB.mediaMarcados >= 1.5) {
        probabilidade += 5;
    }

    return Math.min(Math.round(probabilidade), 95);
}

// ======================================
// OVER 2.5 (ORIGINAL MANTIDO)
// ======================================

function calcularOver25(timeA, timeB, h2h) {
    let mediaA = (timeA.mediaMarcados + timeA.mediaSofridos) * 20;
    let mediaB = (timeB.mediaMarcados + timeB.mediaSofridos) * 20;

    let score = 0;
    score += mediaA * 0.35;
    score += mediaB * 0.35;
    score += h2h.over25 * 0.30;

    return Math.round(Math.max(0, Math.min(100, score)));
}

// ======================================
// ESCOLHER MELHOR APOSTA
// ======================================

function escolherMelhorAposta(lista) {
    let melhor = lista[0];
    lista.forEach(item => {
        if (item.probabilidade > melhor.probabilidade) {
            melhor = item;
        }
    });
    return melhor;
}

// ======================================
// ANÁLISE PRINCIPAL (SÓ O TIME B MUDOU AQUI)
// ======================================

// ======================================
// AJUSTE POR CONTEXTO DE COMPETIÇÃO
// ======================================

function aplicarAjusteCompeticao(btts, over25, probEmpate, tipoCompeticao) {
    let bttsAjustado = btts;
    let over25Ajustado = over25;
    let empateAjustado = probEmpate;

    if (tipoCompeticao === "matamata") {
        // MATA-MATA: Jogos mais fechados e cautelosos
        bttsAjustado = Math.round(btts * 0.88);     // Reduz ~12% do BTTS
        over25Ajustado = Math.round(over25 * 0.85); // Reduz ~15% do Over 2.5
        empateAjustado = Math.round(probEmpate * 1.15); // Aumenta ~15% o risco de Empate
    } else {
        // LIGA (Pontos Corridos): Necessidade de buscar vitória
        bttsAjustado = Math.min(95, Math.round(btts * 1.05));     // Bônus de +5% no BTTS
        over25Ajustado = Math.min(95, Math.round(over25 * 1.05)); // Bônus de +5% no Over 2.5
    }

    return {
        btts: bttsAjustado,
        over25: over25Ajustado,
        empate: empateAjustado
    };
}

function analisarPartida() {
    // 1. CAPTURA DO TIPO DE COMPETIÇÃO
    const tipoCompeticao = document.getElementById("tipoCompeticao")?.value || "liga";

    // 2. OBTENÇÃO DOS DADOS
    const jogosA = obterJogosTime("a");
    const jogosB = obterJogosTime("b");
    const h2hJogos = obterH2H();

    // 3. CÁLCULO DAS ESTATÍSTICAS
    const timeA = calcularEstatisticas(jogosA);
    const timeB = calcularEstatisticas(jogosB);
    const h2h = calcularH2H(h2hJogos);

    // 4. PROBABILIDADES BASE
    const vitoriaA = calcularVitoriaTimeA(timeA, timeB, h2h);
    const vitoriaB = calcularVitoriaTimeB(timeA, timeB, h2h);

    let btts = calcularBTTS(timeA, timeB, h2h);
    let over25 = calcularOver25(timeA, timeB, h2h);

    // Estimativa da taxa de empate do confronto para a ponderação
    const taxaEmpateConfronto = (timeA.taxaEmpate + timeB.taxaEmpate + h2h.empate) / 3;

    // 5. APLICA A PONDERAÇÃO MATA-MATA VS LIGA
    const ajustes = aplicarAjusteCompeticao(btts, over25, taxaEmpateConfronto, tipoCompeticao);
    btts = ajustes.btts;
    over25 = ajustes.over25;

    // 6. MONTAGEM DOS MERCADOS DISPONÍVEIS
    const mercados = [
        { nome: "Vitória Time A", probabilidade: vitoriaA },
        { nome: "Ambos Marcam", probabilidade: btts },
        { nome: "Over 2.5 Gols", probabilidade: over25 }
    ];

    // --- REGRA EXCLUSIVA PARA O TIME B ---
    if (vitoriaB >= 60) {
        // Super favorito -> Mantém Vitória Seca
        mercados.push({ nome: "Vitória Time B", probabilidade: vitoriaB });
    } else if (vitoriaB >= 45) {
        // Faixa de Risco (45% a 59%) -> Converte para Empate Anula (DNB)
        const probDNB = Math.min(90, Math.round(vitoriaB + (taxaEmpateConfronto * 0.6)));
        mercados.push({ nome: "Empate Anula - Time B", probabilidade: probDNB });
    } else {
        mercados.push({ nome: "Vitória Time B", probabilidade: vitoriaB });
    }

    // 7. SELEÇÃO DA MELHOR APOSTA
    const melhor = escolherMelhorAposta(mercados);

    // 8. GERAÇÃO DOS MOTIVOS BASEADOS NA MELHOR OPÇÃO
    const motivos = gerarMotivos(melhor.nome, timeA, timeB, h2h);

    const resultado = document.getElementById("resultado");

    // 9. FILTRO DE CONFIANÇA MÍNIMA (60%)
    if (melhor.probabilidade < 60) {
        resultado.innerHTML = `
            <h3>⚠️ Sem entrada recomendada</h3>
            <p>Maior confiança: ${melhor.probabilidade}%</p>
        `;
        return;
    }

    // 10. EXIBIÇÃO DOS RESULTADOS NA INTERFACE
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
// ANÁLISE EXCLUSIVA DE CONFRONTO DIRETO (H2H) - COM AJUSTE DE COMPETIÇÃO
// ======================================

function analisarApenasH2H() {
    // 1. CAPTURA DO TIPO DE COMPETIÇÃO
    const tipoCompeticao = document.getElementById("tipoCompeticao")?.value || "liga";

    const h2hJogos = obterH2H();
    const h2h = calcularH2H(h2hJogos);

    // Captura taxa de empate real do H2H
    const taxaEmpateH2H = h2h.empate;

    // 2. APLICA A PONDERAÇÃO MATA-MATA VS LIGA NO H2H
    let bttsH2H = Math.round(h2h.btts);
    let over25H2H = Math.round(h2h.over25);

    const ajustes = aplicarAjusteCompeticao(bttsH2H, over25H2H, taxaEmpateH2H, tipoCompeticao);
    bttsH2H = ajustes.btts;
    over25H2H = ajustes.over25;

    // Aplica o desconto de 12% na força do visitante no H2H
    const forcaH2H_A = h2h.vitoriaA;
    const forcaH2H_B = h2h.vitoriaB * 0.88;

    // Recalcula as probabilidades relativas de vitória
    const totalForca = forcaH2H_A + forcaH2H_B;
    const probVitA = totalForca > 0 ? Math.round((forcaH2H_A / totalForca) * 100) : 0;
    const probVitB = totalForca > 0 ? Math.round((forcaH2H_B / totalForca) * 100) : 0;

    // Lista com todas as alternativas possíveis baseadas no H2H ajustado
    const mercadosH2H = [
        { nome: "Vitória Time A (H2H)", probabilidade: probVitA },
        { nome: "Ambos Marcam (H2H)", probabilidade: bttsH2H },
        { nome: "Over 2.5 Gols (H2H)", probabilidade: over25H2H }
    ];

    // Regra DNB para o Time B no H2H
    if (probVitB >= 60) {
        mercadosH2H.push({ nome: "Vitória Time B (H2H)", probabilidade: probVitB });
    } else if (probVitB >= 45) {
        const probDNB = Math.min(90, Math.round(probVitB + (taxaEmpateH2H * 0.6)));
        mercadosH2H.push({ nome: "Empate Anula - Time B (H2H)", probabilidade: probDNB });
    } else {
        mercadosH2H.push({ nome: "Vitória Time B (H2H)", probabilidade: probVitB });
    }

    // Seleciona a melhor alternativa do H2H
    const melhorH2H = escolherMelhorAposta(mercadosH2H);

    // Exibe o resultado na tela
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

function gerarMotivos(mercado, timeA, timeB, h2h) {

    const motivos = [];

    if (mercado === "Ambos Marcam") {
        if (timeA.btts >= 60)
            motivos.push(`✓ Time A teve BTTS em ${Math.round(timeA.btts)}% dos jogos`);

        if (timeB.btts >= 60)
            motivos.push(`✓ Time B teve BTTS em ${Math.round(timeB.btts)}% dos jogos`);

        if (h2h.btts >= 60)
            motivos.push(`✓ H2H teve BTTS em ${Math.round(h2h.btts)}% dos confrontos`);

        if (timeA.mediaMarcados >= 1)
            motivos.push(`✓ Time A marcou média de ${timeA.mediaMarcados.toFixed(1)} gols`);

        if (timeB.mediaMarcados >= 1)
            motivos.push(`✓ Time B marcou média de ${timeB.mediaMarcados.toFixed(1)} gols`);
    }

    if (mercado === "Over 2.5 Gols") {
        if (timeA.over25 >= 60)
            motivos.push(`✓ Time A teve Over 2.5 em ${Math.round(timeA.over25)}% dos jogos`);

        if (timeB.over25 >= 60)
            motivos.push(`✓ Time B teve Over 2.5 em ${Math.round(timeB.over25)}% dos jogos`);

        if (h2h.over25 >= 60)
            motivos.push(`✓ H2H teve Over 2.5 em ${Math.round(h2h.over25)}% dos confrontos`);
    }

    if (mercado === "Vitória Time A") {
        if (timeA.forma > timeB.forma)
            motivos.push(`✓ Time A possui melhor forma recente`);

        if (timeA.mediaMarcados > timeB.mediaMarcados)
            motivos.push(`✓ Time A possui ataque mais eficiente`);

        if (timeA.mediaSofridos < timeB.mediaSofridos)
            motivos.push(`✓ Time A possui defesa mais sólida`);

        if (h2h.vitoriaA > h2h.vitoriaB)
            motivos.push(`✓ Time A leva vantagem nos confrontos diretos`);
    }

    // --- AJUSTE AQUI: Aceita tanto Vitória Time B quanto Empate Anula ---
    if (mercado === "Vitória Time B" || mercado === "Empate Anula - Time B") {

        if (mercado === "Empate Anula - Time B") {
            motivos.push(`🛡️ Entrada protegida em caso de empate (DNB)`);
        }

        if (timeB.forma > timeA.forma)
            motivos.push(`✓ Time B possui melhor forma recente`);

        if (timeB.mediaMarcados > timeA.mediaMarcados)
            motivos.push(`✓ Time B possui ataque mais eficiente`);

        if (timeB.mediaSofridos < timeA.mediaSofridos)
            motivos.push(`✓ Time B possui defesa mais sólida`);

        if (h2h.vitoriaB > h2h.vitoriaA)
            motivos.push(`✓ Time B leva vantagem nos confrontos diretos`);
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