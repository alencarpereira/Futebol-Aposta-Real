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
// ESTATÍSTICAS PONDERADAS (PESOS 5 a 1)
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
// PROBABILIDADES DE RESULTADO FINAL (1X2)
// ======================================

function calcularProbabilidades1X2(timeA, timeB, h2h) {
    // Cálculo de Força Bruta
    let forcaA = (timeA.forma * 0.40) +
        (timeA.mediaMarcados * 20 * 0.25) +
        (Math.max(0, 3 - timeA.mediaSofridos) * 20 * 0.15) +
        (h2h.vitoriaA * 0.20);

    let forcaB = (timeB.forma * 0.40) +
        (timeB.mediaMarcados * 20 * 0.25) +
        (Math.max(0, 3 - timeB.mediaSofridos) * 20 * 0.15) +
        (h2h.vitoriaB * 0.20);

    // Vantagem de Mando de Campo (Time A +12%, Time B -5%)
    forcaA *= 1.12;
    forcaB *= 0.95;

    // Estimativa de Tendência ao Empate
    const tendenciaEmpate = (timeA.taxaEmpate * 0.35) +
        (timeB.taxaEmpate * 0.35) +
        (h2h.empate * 0.30);

    // Ajuste da barra de 100% considerando a margem do Empate
    const probEmpateBruta = Math.min(35, Math.max(18, tendenciaEmpate));
    const margemVitoria = 100 - probEmpateBruta;

    const probA = Math.round((forcaA / (forcaA + forcaB)) * margemVitoria);
    const probB = Math.round((forcaB / (forcaA + forcaB)) * margemVitoria);
    const probEmpate = 100 - (probA + probB);

    return { probA, probB, probEmpate };
}

// ======================================
// MERCADOS DE GOLS
// ======================================

function calcularBTTS(timeA, timeB, h2h) {
    let prob = (timeA.btts * 0.35) + (timeB.btts * 0.35) + (h2h.btts * 0.30);

    // Bônus se ambos possuem boa média de gols
    if (timeA.mediaMarcados >= 1.2 && timeB.mediaMarcados >= 1.2) {
        prob += 8;
    }

    return Math.min(Math.round(prob), 92);
}

function calcularOver25(timeA, timeB, h2h) {
    // Baseado na frequência real de jogos com +2.5 gols
    let prob = (timeA.over25 * 0.35) + (timeB.over25 * 0.35) + (h2h.over25 * 0.30);

    // Penalização se as defesas forem muito fechadas
    if (timeA.mediaSofridos < 0.8 && timeB.mediaSofridos < 0.8) {
        prob -= 10;
    }

    return Math.max(10, Math.min(90, Math.round(prob)));
}

// ======================================
// ANÁLISE PRINCIPAL E SELEÇÃO DE MERCADO
// ======================================

function analisarPartida() {
    const jogosA = obterJogosTime("a");
    const jogosB = obterJogosTime("b");
    const h2hJogos = obterH2H();

    const timeA = calcularEstatisticas(jogosA);
    const timeB = calcularEstatisticas(jogosB);
    const h2h = calcularH2H(h2hJogos);

    const { probA, probB, probEmpate } = calcularProbabilidades1X2(timeA, timeB, h2h);
    const btts = calcularBTTS(timeA, timeB, h2h);
    const over25 = calcularOver25(timeA, timeB, h2h);

    const mercados = [];

    // Seleção Inteligente de Mercados
    mercados.push({ nome: "Vitória Time A", probabilidade: probA });

    // Proteção para o Time B (DNB se probabilidade for razoável, mas incerta)
    if (probB >= 45 && probB < 60) {
        mercados.push({
            nome: "Empate Anula - Time B",
            probabilidade: Math.round(probB + (probEmpate * 0.6))
        });
    } else {
        mercados.push({ nome: "Vitória Time B", probabilidade: probB });
    }

    mercados.push({ nome: "Ambos Marcam", probabilidade: btts });
    mercados.push({ nome: "Over 2.5 Gols", probabilidade: over25 });

    // Ordenar melhor aposta
    mercados.sort((a, b) => b.probabilidade - a.probabilidade);
    const melhor = mercados[0];

    const resultado = document.getElementById("resultado");

    if (melhor.probabilidade < 60) {
        resultado.innerHTML = `
            <h3>⚠️ Sem entrada segura recomendada</h3>
            <p>Maior confiança encontrada: <strong>${melhor.nome} (${melhor.probabilidade}%)</strong></p>
        `;
        return;
    }

    resultado.innerHTML = `
        <div class="resultado-top">
            <strong>🔥 Sugestão: ${melhor.nome}</strong>
            <span class="probabilidade">${melhor.probabilidade}%</span>
        </div>
        <div class="cards" style="display:flex; gap:10px; margin-top:15px;">
            <div class="card"><span>Vitória A:</span> <strong>${probA}%</strong></div>
            <div class="card"><span>Empate:</span> <strong>${probEmpate}%</strong></div>
            <div class="card"><span>Vitória B:</span> <strong>${probB}%</strong></div>
            <div class="card"><span>BTTS:</span> <strong>${btts}%</strong></div>
            <div class="card"><span>Over 2.5:</span> <strong>${over25}%</strong></div>
        </div>
    `;
}

function gerarMotivos(
    mercado,
    timeA,
    timeB,
    h2h
) {

    const motivos = [];

    if (mercado === "Ambos Marcam") {

        if (timeA.btts >= 60)
            motivos.push(
                `✓ Time A teve BTTS em ${Math.round(timeA.btts)}% dos jogos`
            );

        if (timeB.btts >= 60)
            motivos.push(
                `✓ Time B teve BTTS em ${Math.round(timeB.btts)}% dos jogos`
            );

        if (h2h.btts >= 60)
            motivos.push(
                `✓ H2H teve BTTS em ${Math.round(h2h.btts)}% dos confrontos`
            );

        if (timeA.mediaMarcados >= 1)
            motivos.push(
                `✓ Time A marcou média de ${timeA.mediaMarcados.toFixed(1)} gols`
            );

        if (timeB.mediaMarcados >= 1)
            motivos.push(
                `✓ Time B marcou média de ${timeB.mediaMarcados.toFixed(1)} gols`
            );

    }

    if (mercado === "Over 2.5 Gols") {

        if (timeA.over25 >= 60)
            motivos.push(
                `✓ Time A teve Over 2.5 em ${Math.round(timeA.over25)}% dos jogos`
            );

        if (timeB.over25 >= 60)
            motivos.push(
                `✓ Time B teve Over 2.5 em ${Math.round(timeB.over25)}% dos jogos`
            );

        if (h2h.over25 >= 60)
            motivos.push(
                `✓ H2H teve Over 2.5 em ${Math.round(h2h.over25)}% dos confrontos`
            );

    }

    if (mercado === "Vitória Time A") {

        if (timeA.forma > timeB.forma)
            motivos.push(
                `✓ Time A possui melhor forma recente`
            );

        if (timeA.mediaMarcados > timeB.mediaMarcados)
            motivos.push(
                `✓ Time A possui ataque mais eficiente`
            );

        if (timeA.mediaSofridos < timeB.mediaSofridos)
            motivos.push(
                `✓ Time A possui defesa mais sólida`
            );

        if (h2h.vitoriaA > h2h.vitoriaB)
            motivos.push(
                `✓ Time A leva vantagem nos confrontos diretos`
            );

    }

    if (mercado === "Vitória Time B") {

        if (timeB.forma > timeA.forma)
            motivos.push(
                `✓ Time B possui melhor forma recente`
            );

        if (timeB.mediaMarcados > timeA.mediaMarcados)
            motivos.push(
                `✓ Time B possui ataque mais eficiente`
            );

        if (timeB.mediaSofridos < timeA.mediaSofridos)
            motivos.push(
                `✓ Time B possui defesa mais sólida`
            );

        if (h2h.vitoriaB > h2h.vitoriaA)
            motivos.push(
                `✓ Time B leva vantagem nos confrontos diretos`
            );

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