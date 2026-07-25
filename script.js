// ======================================
// CAPTURA DOS DADOS
// ======================================

function obterJogosTime(prefixo) {

    const jogos = [];

    for (let i = 1; i <= 5; i++) {

        jogos.push({
            marcou: Number(document.getElementById(`${prefixo}_m${i}`).value) || 0,
            sofreu: Number(document.getElementById(`${prefixo}_s${i}`).value) || 0
        });

    }

    return jogos;
}

function obterH2H() {

    const jogos = [];

    for (let i = 1; i <= 5; i++) {

        jogos.push({
            golsA: Number(document.getElementById(`h_a${i}`).value) || 0,
            golsB: Number(document.getElementById(`h_b${i}`).value) || 0
        });

    }

    return jogos;
}


// ======================================
// ESTATÍSTICAS COM PESO
// MAIS RECENTE = PESO 5
// MAIS ANTIGO = PESO 1
// ======================================

function calcularEstatisticas(jogos) {

    const pesos = [5, 4, 3, 2, 1];

    let pontos = 0;
    let golsMarcados = 0;
    let golsSofridos = 0;

    let btts = 0;
    let over25 = 0;

    let pesoTotal = 0;

    jogos.forEach((jogo, index) => {

        const peso = pesos[index];

        pesoTotal += peso;

        golsMarcados += jogo.marcou * peso;
        golsSofridos += jogo.sofreu * peso;

        if (jogo.marcou > jogo.sofreu)
            pontos += 3 * peso;

        if (jogo.marcou === jogo.sofreu)
            pontos += 1 * peso;

        if (jogo.marcou > 0 && jogo.sofreu > 0)
            btts++;

        if ((jogo.marcou + jogo.sofreu) > 2)
            over25++;
    });

    return {

        forma: (pontos / (pesoTotal * 3)) * 100,

        mediaMarcados:
            golsMarcados / pesoTotal,

        mediaSofridos:
            golsSofridos / pesoTotal,

        btts:
            (btts / jogos.length) * 100,

        over25:
            (over25 / jogos.length) * 100

    };

}


// ======================================
// ESTATÍSTICAS H2H
// ======================================

function calcularH2H(h2h) {

    let venceuA = 0;
    let venceuB = 0;

    let btts = 0;
    let over25 = 0;

    h2h.forEach(jogo => {

        if (jogo.golsA > jogo.golsB)
            venceuA++;

        if (jogo.golsB > jogo.golsA)
            venceuB++;

        if (jogo.golsA > 0 && jogo.golsB > 0)
            btts++;

        if ((jogo.golsA + jogo.golsB) > 2)
            over25++;

    });

    return {

        vitoriaA: (venceuA / 5) * 100,

        vitoriaB: (venceuB / 5) * 100,

        btts: (btts / 5) * 100,

        over25: (over25 / 5) * 100

    };

}


// ======================================
// VITÓRIA TIME A
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

    return Math.round(
        (forcaA / (forcaA + forcaB)) * 100
    );

}


// ======================================
// VITÓRIA TIME B
// ======================================
function calcularVitoriaTimeB(timeA, timeB, h2h) {

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

    return Math.round(
        (forcaB / (forcaA + forcaB)) * 100
    );

}

// ======================================
// BTTS
// ======================================

function calcularBTTS(timeA, timeB, h2h) {

    let probabilidade =

        (timeA.btts * 0.35) +
        (timeB.btts * 0.35) +
        (h2h.btts * 0.30);

    if (
        timeA.mediaMarcados >= 1.5 &&
        timeB.mediaMarcados >= 1.5
    ) {
        probabilidade += 5;
    }

    return Math.min(
        Math.round(probabilidade),
        95
    );

}


// ======================================
// OVER 2.5
// ======================================

function calcularOver25(timeA, timeB, h2h) {

    let mediaA =
        (timeA.mediaMarcados +
            timeA.mediaSofridos) * 20;

    let mediaB =
        (timeB.mediaMarcados +
            timeB.mediaSofridos) * 20;

    let score = 0;

    score += mediaA * 0.35;

    score += mediaB * 0.35;

    score += h2h.over25 * 0.30;

    return Math.round(
        Math.max(0, Math.min(100, score))
    );

}


// ======================================
// ESCOLHER MELHOR
// ======================================

function escolherMelhorAposta(lista) {

    let melhor = lista[0];

    lista.forEach(item => {

        if (item.probabilidade >
            melhor.probabilidade) {

            melhor = item;

        }

    });

    return melhor;

}


// ======================================
// ANÁLISE PRINCIPAL
// ======================================

function analisarPartida() {

    const jogosA =
        obterJogosTime("a");

    const jogosB =
        obterJogosTime("b");

    const h2hJogos =
        obterH2H();

    const timeA =
        calcularEstatisticas(jogosA);

    const timeB =
        calcularEstatisticas(jogosB);

    const h2h =
        calcularH2H(h2hJogos);

    const vitoriaA =
        calcularVitoriaTimeA(
            timeA,
            timeB,
            h2h
        );

    const vitoriaB =
        calcularVitoriaTimeB(
            timeA,
            timeB,
            h2h
        );

    const btts =
        calcularBTTS(
            timeA,
            timeB,
            h2h
        );

    const over25 =
        calcularOver25(
            timeA,
            timeB,
            h2h
        );

    const mercados = [

        {
            nome: "Vitória Time A",
            probabilidade: vitoriaA
        },

        {
            nome: "Vitória Time B",
            probabilidade: vitoriaB
        },

        {
            nome: "Ambos Marcam",
            probabilidade: btts
        },

        {
            nome: "Over 2.5 Gols",
            probabilidade: over25
        }

    ];

    const melhor =
        escolherMelhorAposta(mercados);
    const motivos =
        gerarMotivos(
            melhor.nome,
            timeA,
            timeB,
            h2h
        );

    const resultado =
        document.getElementById("resultado");

    if (melhor.probabilidade < 60) {

        resultado.innerHTML = `
            <h3>⚠️ Sem entrada recomendada</h3>
            <p>Maior confiança: ${melhor.probabilidade}%</p>
        `;

        return;
    }

    resultado.innerHTML = `

<div class="resultado-top">

    <strong>
        🔥 ${melhor.nome}
    </strong>

    <span class="probabilidade">
        ${melhor.probabilidade}%
    </span>

</div>

<div class="motivos-box">

    <h3>Motivos</h3>

    <ul>
        ${motivos.map(
        motivo => `<li>${motivo}</li>`
    ).join("")}
    </ul>

</div>

<div class="cards">

<div class="card">
    <span>Vitória A</span>
    <strong>${vitoriaA}%</strong>
</div>

<div class="card">
    <span>Vitória B</span>
    <strong>${vitoriaB}%</strong>
</div>

<div class="card">
    <span>BTTS</span>
    <strong>${btts}%</strong>
</div>

<div class="card">
    <span>Over 2.5</span>
    <strong>${over25}%</strong>
</div>

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