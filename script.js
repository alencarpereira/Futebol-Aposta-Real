// ======================================
// CAPTURA DOS DADOS (FORMULÁRIO & ODDS)
// ======================================

function parseInputNumber(id) {
    const val = document.getElementById(id)?.value?.toString().replace(',', '.').trim();
    const num = Number(val);
    return isNaN(num) ? 0 : num;
}

function obterJogosTime(prefixo) {
    const jogos = [];
    for (let i = 1; i <= 5; i++) {
        const inputM = document.getElementById(`${prefixo}_m${i}`)?.value;
        const inputS = document.getElementById(`${prefixo}_s${i}`)?.value;

        // Só adiciona a partida se AMBOS os placares forem informados
        if (inputM !== "" && inputS !== "" && inputM !== undefined && inputS !== undefined) {
            jogos.push({
                marcou: parseInputNumber(`${prefixo}_m${i}`),
                sofreu: parseInputNumber(`${prefixo}_s${i}`)
            });
        }
    }
    return jogos;
}

function obterH2H() {
    const jogos = [];
    for (let i = 1; i <= 5; i++) {
        const inputA = document.getElementById(`h_a${i}`)?.value;
        const inputB = document.getElementById(`h_b${i}`)?.value;

        if (inputA !== "" && inputB !== "" && inputA !== undefined && inputB !== undefined) {
            jogos.push({
                golsA: parseInputNumber(`h_a${i}`),
                golsB: parseInputNumber(`h_b${i}`)
            });
        }
    }
    return jogos;
}

function obterProbabilidadesMercado() {
    const oddA = parseInputNumber("oddA");
    const oddEmpate = parseInputNumber("oddEmpate");
    const oddB = parseInputNumber("oddB");

    // Novas Odds de Gols
    const oddOver25 = parseInputNumber("oddOver25");
    const oddBTTS = parseInputNumber("oddBTTS");

    if (!oddA || !oddB || !oddEmpate) return null;

    const probBrutaA = 1 / oddA;
    const probBrutaE = 1 / oddEmpate;
    const probBrutaB = 1 / oddB;
    const somaMargin = probBrutaA + probBrutaE + probBrutaB;

    return {
        oddA,
        oddEmpate,
        oddB,
        oddOver25, // retorna 0 se não preenchida
        oddBTTS,   // retorna 0 se não preenchida
        probMercadoA: (probBrutaA / somaMargin) * 100,
        probMercadoB: (probBrutaB / somaMargin) * 100,
        probMercadoE: (probBrutaE / somaMargin) * 100
    };
}

// ======================================
// ESTATÍSTICAS COM PESO
// ======================================
function calcularEstatisticas(jogos) {
    // TRAVA ANTI-NaN: Se não houver jogos no formulário, retorna tudo zerado em vez de quebrar
    if (!jogos || jogos.length === 0) {
        return {
            forma: 0,
            mediaMarcados: 0,
            mediaSofridos: 0,
            taxaEmpate: 0,
            btts: 0,
            over25: 0
        };
    }

    const pesos = [5, 4, 3, 2, 1];
    let pontos = 0;
    let golsMarcados = 0;
    let golsSofridos = 0;
    let btts = 0;
    let over25 = 0;
    let empates = 0;
    let pesoTotal = 0;

    jogos.forEach((jogo, index) => {
        const peso = pesos[index] || 1;
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

    const totalJogos = jogos.length;

    return {
        forma: (pontos / (pesoTotal * 3)) * 100,
        mediaMarcados: golsMarcados / pesoTotal,
        mediaSofridos: golsSofridos / pesoTotal,
        taxaEmpate: (empates / totalJogos) * 100,
        btts: (btts / totalJogos) * 100,
        over25: (over25 / totalJogos) * 100
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
    const totalJogos = h2h.length || 1;

    h2h.forEach(jogo => {
        if (jogo.golsA > jogo.golsB) venceuA++;
        else if (jogo.golsB > jogo.golsA) venceuB++;
        else empates++;

        if (jogo.golsA > 0 && jogo.golsB > 0) btts++;
        if ((jogo.golsA + jogo.golsB) > 2) over25++;
    });

    return {
        vitoriaA: (venceuA / totalJogos) * 100,
        vitoriaB: (venceuB / totalJogos) * 100,
        empate: (empates / totalJogos) * 100,
        btts: (btts / totalJogos) * 100,
        over25: (over25 / totalJogos) * 100
    };
}

// ======================================
// VITÓRIA TIME A E TIME B
// ======================================

function calcularForcasGerais(timeA, timeB, h2h) {
    let forcaA =
        (timeA.forma * 0.40) +
        (timeA.mediaMarcados * 20 * 0.25) +
        (Math.max(0, 3 - timeA.mediaSofridos) * 20 * 0.15) +
        (h2h.vitoriaA * 0.20);

    let forcaB =
        (timeB.forma * 0.40) +
        (timeB.mediaMarcados * 20 * 0.25) +
        (Math.max(0, 3 - timeB.mediaSofridos) * 20 * 0.15) +
        (h2h.vitoriaB * 0.20);

    forcaA = forcaA * 1.03; // +3% Mandante
    forcaB = forcaB * 0.96; // -4% Visitante

    return { forcaA, forcaB };
}

function calcularVitoriaTimeA(timeA, timeB, h2h, mercado) {
    const { forcaA, forcaB } = calcularForcasGerais(timeA, timeB, h2h);
    const probEstatisticaA = ((forcaA || 1) / ((forcaA + forcaB) || 1)) * 100;

    if (mercado) {
        return Math.round((probEstatisticaA * 0.60) + (mercado.probMercadoA * 0.40));
    }

    return Math.round(probEstatisticaA);
}

function calcularVitoriaTimeB(timeA, timeB, h2h, mercado) {
    const { forcaA, forcaB } = calcularForcasGerais(timeA, timeB, h2h);
    const probEstatisticaB = ((forcaB || 1) / ((forcaA + forcaB) || 1)) * 100;

    if (mercado) {
        return Math.round((probEstatisticaB * 0.60) + (mercado.probMercadoB * 0.40));
    }

    return Math.round(probEstatisticaB);
}

// ======================================
// MERCADOS DE GOLS E AUXILIARES
// ======================================

function calcularBTTS(timeA, timeB, h2h) {
    let probabilidade =
        (timeA.btts * 0.325) +
        (timeB.btts * 0.325) +
        (h2h.btts * 0.35);

    if (timeA.mediaMarcados >= 1.5 && timeB.mediaMarcados >= 1.5) {
        probabilidade += 5;
    }

    if (timeA.mediaSofridos < 0.8 || timeB.mediaSofridos < 0.8) {
        probabilidade -= 15;
    }

    return Math.max(0, Math.min(Math.round(probabilidade), 95));
}

function calcularOver25(timeA, timeB, h2h) {
    let mediaA = (timeA.mediaMarcados + timeA.mediaSofridos) * 20;
    let mediaB = (timeB.mediaMarcados + timeB.mediaSofridos) * 20;

    let score = (mediaA * 0.35) + (mediaB * 0.35) + (h2h.over25 * 0.30);

    return Math.round(Math.max(0, Math.min(100, score)));
}

function escolherMelhorAposta(lista) {
    if (!lista || lista.length === 0) return { nome: "Nenhuma", probabilidade: 0 };

    let apostaOver = lista.find(item => item.nome.includes("Over 2.5"));
    let apostaBTTS = lista.find(item => item.nome.includes("Ambos Marcam"));

    if (apostaOver && apostaBTTS) {
        if (apostaOver.probabilidade >= 68 && apostaOver.probabilidade >= (apostaBTTS.probabilidade - 5)) {
            return {
                nome: apostaOver.nome,
                probabilidade: Math.min(85, apostaOver.probabilidade)
            };
        }
    }

    let melhor = lista[0];
    lista.forEach(item => {
        if (item.probabilidade > melhor.probabilidade) {
            melhor = item;
        }
    });

    return {
        nome: melhor.nome,
        probabilidade: Math.min(85, melhor.probabilidade)
    };
}

function aplicarAjusteCompeticao(btts, over25, probEmpate, probVitoriaCasa = 0, tipoCompeticao = "liga") {
    let bttsAjustado = btts;
    let over25Ajustado = over25;
    let empateAjustado = probEmpate;
    let casaAjustado = probVitoriaCasa;

    if (tipoCompeticao === "matamata") {
        // Redução leve em gols (jogos estudados/truncados)
        bttsAjustado = Math.round(btts * 0.93);
        over25Ajustado = Math.round(over25 * 0.95);

        // Aumento do Empate (jogos muito parelhos)
        empateAjustado = Math.min(90, Math.round(probEmpate * 1.10));

        // BÔNUS MANDO DE CAMPO: Impulso de 8% no Mandante para o Mata-Mata
        casaAjustado = Math.min(95, Math.round(probVitoriaCasa * 1.08));
    } else {
        // PONTOS CORRIDOS (Liga mantém o padrão)
        bttsAjustado = Math.min(95, Math.round(btts * 1.05));
        over25Ajustado = Math.min(95, Math.round(over25 * 1.05));
    }

    return {
        btts: bttsAjustado,
        over25: over25Ajustado,
        empate: empateAjustado,
        vitoriaCasa: casaAjustado
    };
}

// ======================================
// FUNÇÃO PRINCIPAL DE ANÁLISE (REFATORADA)
// ======================================
function analisarPartida() {
    const nomeTimeA = document.getElementById("timeA")?.value.trim() || "Time A";
    const nomeTimeB = document.getElementById("timeB")?.value.trim() || "Time B";

    const tipoCompeticao = document.getElementById("tipoCompeticao")?.value || "liga";
    const mercadoOdds = obterProbabilidadesMercado();

    const jogosA = obterJogosTime("a");
    const jogosB = obterJogosTime("b");
    const h2hJogos = obterH2H();

    const timeA = calcularEstatisticas(jogosA);
    const timeB = calcularEstatisticas(jogosB);
    const h2h = calcularH2H(h2hJogos);

    let vitoriaA = calcularVitoriaTimeA(timeA, timeB, h2h, mercadoOdds);
    const vitoriaB = calcularVitoriaTimeB(timeA, timeB, h2h, mercadoOdds);

    let btts = calcularBTTS(timeA, timeB, h2h);
    let over25 = calcularOver25(timeA, timeB, h2h);

    const taxaEmpateConfronto = (timeA.taxaEmpate + timeB.taxaEmpate + h2h.empate) / 3;

    // APLICANDO OS AJUSTES DE COMPETIÇÃO
    const ajustes = aplicarAjusteCompeticao(btts, over25, taxaEmpateConfronto, vitoriaA, tipoCompeticao);
    btts = ajustes.btts;
    over25 = ajustes.over25;
    vitoriaA = ajustes.vitoriaCasa || vitoriaA;

    // Captura das Odds do Mercado
    const oddA = mercadoOdds ? mercadoOdds.oddA : 0;
    const oddB = mercadoOdds ? mercadoOdds.oddB : 0;
    const oddOver25 = mercadoOdds ? mercadoOdds.oddOver25 : 0;
    const oddBTTS = mercadoOdds ? mercadoOdds.oddBTTS : 0;

    // IDENTIFICAÇÃO DE SUPER FAVORITO (Odd <= 1.40)
    const eSuperFavoritoA = oddA > 0 && oddA <= 1.40;
    const eSuperFavoritoB = oddB > 0 && oddB <= 1.40;
    const temSuperFavorito = eSuperFavoritoA || eSuperFavoritoB;

    const mercados = [];

    // --- 1. MERCADOS DE GOLS ---
    // Both Teams To Score (BTTS)
    if (!temSuperFavorito && (oddBTTS === 0 || oddBTTS <= 1.85) && btts >= 65) {
        mercados.push({ nome: "Ambos Marcam", probabilidade: btts });
    }

    // Over 2.5 Gols (Requer Over25 >= BTTS + 5%)
    if ((oddOver25 === 0 || oddOver25 <= 1.85) && over25 >= 65 && over25 >= (btts + 5)) {
        mercados.push({ nome: "Over 2.5 Gols", probabilidade: over25 });
    }

    // --- 2. VITÓRIA / DNB TIME A ---
    // Vitória Seca: Requer prob >= 65% e Odd entre 1.40 e 1.80
    if (vitoriaA >= 65 && (oddA === 0 || (oddA >= 1.40 && oddA <= 1.80))) {
        mercados.push({ nome: `Vitória ${nomeTimeA}`, probabilidade: vitoriaA });
    } else if (vitoriaA >= 55 && vitoriaA < 65) {
        const probDNB_A = Math.min(88, Math.round(vitoriaA + (taxaEmpateConfronto * 0.30)));
        if (probDNB_A >= 65) {
            mercados.push({ nome: `Empate Anula - ${nomeTimeA}`, probabilidade: probDNB_A });
        }
    }

    // --- 3. VITÓRIA / DNB TIME B ---
    // Vitória Seca: Requer prob >= 65% e Odd entre 1.40 e 1.80
    if (vitoriaB >= 65 && (oddB === 0 || (oddB >= 1.40 && oddB <= 1.80))) {
        mercados.push({ nome: `Vitória ${nomeTimeB}`, probabilidade: vitoriaB });
    } else if (vitoriaB >= 55 && vitoriaB < 65) {
        const probDNB_B = Math.min(88, Math.round(vitoriaB + (taxaEmpateConfronto * 0.30)));
        if (probDNB_B >= 65) {
            mercados.push({ nome: `Empate Anula - ${nomeTimeB}`, probabilidade: probDNB_B });
        }
    }

    const melhor = escolherMelhorAposta(mercados);
    const resultado = document.getElementById("resultado");

    // TRAVA DE SEGURANÇA FINAL
    if (!melhor || melhor.nome === "Nenhuma" || melhor.probabilidade < 65) {
        resultado.innerHTML = `
            <h3>⚠️ Sem entrada recomendada</h3>
            <p>Confiança abaixo do limite de segurança (Mínimo: 65%) ou odds fora da margem segura. Maior probabilidade analisada: <strong>${melhor ? melhor.probabilidade : 0}%</strong></p>
        `;
        return;
    }

    const motivos = gerarMotivos(melhor.nome, timeA, timeB, h2h, nomeTimeA, nomeTimeB, mercadoOdds);

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
            : "<li>✓ Dados estatísticos e precificação de mercado favoráveis.</li>"
        }
            </ul>
        </div>

        <div class="cards">
            <div class="card"><span>Vitória ${nomeTimeA}</span><strong>${vitoriaA}%</strong></div>
            <div class="card"><span>Vitória ${nomeTimeB}</span><strong>${vitoriaB}%</strong></div>
            <div class="card"><span>BTTS</span><strong>${btts}%</strong></div>
            <div class="card"><span>Over 2.5</span><strong>${over25}%</strong></div>
        </div>
    `;
}
// ======================================
// ANÁLISE EXCLUSIVA H2H (REFATORADA)
// ======================================
function analisarApenasH2H() {
    const nomeTimeA = document.getElementById("timeA")?.value.trim() || "Time A";
    const nomeTimeB = document.getElementById("timeB")?.value.trim() || "Time B";

    const tipoCompeticao = document.getElementById("tipoCompeticao")?.value || "liga";
    const mercadoOdds = obterProbabilidadesMercado();

    const h2hJogos = obterH2H();
    const h2h = calcularH2H(h2hJogos);
    const taxaEmpateH2H = h2h.empate;

    const totalJogosH2H = h2hJogos.length || 1;
    let somaGolsA = 0;
    let somaGolsB = 0;

    h2hJogos.forEach(j => {
        somaGolsA += j.golsA;
        somaGolsB += j.golsB;
    });

    const timeA_H2H = {
        forma: h2h.vitoriaA,
        mediaMarcados: somaGolsA / totalJogosH2H,
        mediaSofridos: somaGolsB / totalJogosH2H,
        btts: h2h.btts,
        over25: h2h.over25
    };

    const timeB_H2H = {
        forma: h2h.vitoriaB,
        mediaMarcados: somaGolsB / totalJogosH2H,
        mediaSofridos: somaGolsA / totalJogosH2H,
        btts: h2h.btts,
        over25: h2h.over25
    };

    // 1. Probabilidades Base de Vitória (30% H2H + 70% Mercado)
    let probVitA = Math.round(h2h.vitoriaA);
    let probVitB = Math.round(h2h.vitoriaB);

    if (mercadoOdds) {
        probVitA = Math.round((mercadoOdds.probMercadoA * 0.70) + (probVitA * 0.30));
        probVitB = Math.round((mercadoOdds.probMercadoB * 0.70) + (probVitB * 0.30));
    }

    // 2. Probabilidades Base de Gols (30% H2H + 70% Mercado)
    let bttsH2H = Math.round(h2h.btts);
    let over25H2H = Math.round(h2h.over25);

    if (mercadoOdds) {
        if (mercadoOdds.oddBTTS > 0) {
            const probBTTS_Casa = (1 / mercadoOdds.oddBTTS) * 100;
            bttsH2H = Math.round((probBTTS_Casa * 0.70) + (bttsH2H * 0.30));
        }
        if (mercadoOdds.oddOver25 > 0) {
            const probOver_Casa = (1 / mercadoOdds.oddOver25) * 100;
            over25H2H = Math.round((probOver_Casa * 0.70) + (over25H2H * 0.30));
        }
    }

    // 3. Aplicação dos Ajustes de Competição
    const ajustes = aplicarAjusteCompeticao(bttsH2H, over25H2H, taxaEmpateH2H, probVitA, tipoCompeticao);
    bttsH2H = ajustes.btts;
    over25H2H = ajustes.over25;
    probVitA = ajustes.vitoriaCasa || probVitA;

    const oddA = mercadoOdds ? mercadoOdds.oddA : 0;
    const oddB = mercadoOdds ? mercadoOdds.oddB : 0;
    const oddOver25 = mercadoOdds ? mercadoOdds.oddOver25 : 0;
    const oddBTTS = mercadoOdds ? mercadoOdds.oddBTTS : 0;

    const eSuperFavoritoA = oddA > 0 && oddA <= 1.40;
    const eSuperFavoritoB = oddB > 0 && oddB <= 1.40;
    const temSuperFavorito = eSuperFavoritoA || eSuperFavoritoB;

    const mercadosH2H = [];

    // --- 1. MERCADOS DE GOLS ---
    // Both Teams To Score (BTTS)
    if (!temSuperFavorito && (oddBTTS === 0 || oddBTTS <= 1.85) && bttsH2H >= 65) {
        mercadosH2H.push({ nome: "Ambos Marcam", probabilidade: bttsH2H });
    }

    // Over 2.5 Gols (Requer Over25 >= BTTS + 5%)
    if ((oddOver25 === 0 || oddOver25 <= 1.85) && over25H2H >= 65 && over25H2H >= (bttsH2H + 5)) {
        mercadosH2H.push({ nome: "Over 2.5 Gols", probabilidade: over25H2H });
    }

    // --- 2. VITÓRIA / DNB TIME A ---
    if (probVitA >= 65 && (oddA === 0 || (oddA >= 1.40 && oddA <= 1.80))) {
        mercadosH2H.push({ nome: `Vitória ${nomeTimeA}`, probabilidade: probVitA });
    } else if (probVitA >= 55 && probVitA < 65) {
        const probDNB_A = Math.min(88, Math.round(probVitA + (taxaEmpateH2H * 0.30)));
        if (probDNB_A >= 65) {
            mercadosH2H.push({ nome: `Empate Anula - ${nomeTimeA}`, probabilidade: probDNB_A });
        }
    }

    // --- 3. VITÓRIA / DNB TIME B ---
    if (probVitB >= 65 && (oddB === 0 || (oddB >= 1.40 && oddB <= 1.80))) {
        mercadosH2H.push({ nome: `Vitória ${nomeTimeB}`, probabilidade: probVitB });
    } else if (probVitB >= 55 && probVitB < 65) {
        const probDNB_B = Math.min(88, Math.round(probVitB + (taxaEmpateH2H * 0.30)));
        if (probDNB_B >= 65) {
            mercadosH2H.push({ nome: `Empate Anula - ${nomeTimeB}`, probabilidade: probDNB_B });
        }
    }

    const melhorH2H = escolherMelhorAposta(mercadosH2H);
    const resultado = document.getElementById("resultado");

    if (!melhorH2H || melhorH2H.nome === "Nenhuma" || melhorH2H.probabilidade < 65) {
        resultado.innerHTML = `
            <h3>⚠️ H2H + Mercado Inconclusivo</h3>
            <p>Não foi possível encaixar um palpite dentro dos critérios de segurança (Mínimo: 65%) e odds do mercado. Maior probabilidade analisada: <strong>${melhorH2H ? melhorH2H.probabilidade : 0}%</strong></p>
        `;
        return;
    }

    const motivos = gerarMotivos(melhorH2H.nome, timeA_H2H, timeB_H2H, h2h, nomeTimeA, nomeTimeB, mercadoOdds);

    resultado.innerHTML = `
        <div class="resultado-top">
            <strong>⚔️ Sugestão H2H: ${melhorH2H.nome}</strong>
            <span class="probabilidade">${melhorH2H.probabilidade}%</span>
        </div>

        <div class="motivos-box">
            <h3>Motivos</h3>
            <ul>
                ${motivos.length > 0
            ? motivos.map(m => `<li>${m}</li>`).join("")
            : "<li>✓ Seleção ponderada respeitando a odd limite (<= 1.85) e o histórico direto.</li>"
        }
            </ul>
        </div>

        <div class="cards">
            <div class="card"><span>Vitória ${nomeTimeA} (30/70)</span><strong>${probVitA}%</strong></div>
            <div class="card"><span>Vitória ${nomeTimeB} (30/70)</span><strong>${probVitB}%</strong></div>
            <div class="card"><span>BTTS (Ponderado)</span><strong>${bttsH2H}%</strong></div>
            <div class="card"><span>Over 2.5 (Ponderado)</span><strong>${over25H2H}%</strong></div>
        </div>
    `;
}

function gerarApostaMultipla() {
    const nomeTimeA = document.getElementById("timeA")?.value.trim() || "Time A";
    const nomeTimeB = document.getElementById("timeB")?.value.trim() || "Time B";

    const tipoCompeticao = document.getElementById("tipoCompeticao")?.value || "liga";
    const mercadoOdds = obterProbabilidadesMercado();

    const jogosA = obterJogosTime("a");
    const jogosB = obterJogosTime("b");
    const h2hJogos = obterH2H();

    const timeA = calcularEstatisticas(jogosA);
    const timeB = calcularEstatisticas(jogosB);
    const h2h = calcularH2H(h2hJogos);

    let vitoriaA = calcularVitoriaTimeA(timeA, timeB, h2h, mercadoOdds);
    const vitoriaB = calcularVitoriaTimeB(timeA, timeB, h2h, mercadoOdds);

    let btts = calcularBTTS(timeA, timeB, h2h);
    let over25 = calcularOver25(timeA, timeB, h2h);

    const taxaEmpateConfronto = (timeA.taxaEmpate + timeB.taxaEmpate + h2h.empate) / 3;

    // APLICANDO OS AJUSTES DE COMPETIÇÃO
    const ajustes = aplicarAjusteCompeticao(btts, over25, taxaEmpateConfronto, vitoriaA, tipoCompeticao);
    btts = ajustes.btts;
    over25 = ajustes.over25;
    vitoriaA = ajustes.vitoriaCasa || vitoriaA;

    // --- LEITURA DAS ODDS DO MERCADO ---
    const oddA = mercadoOdds?.oddA || 0;
    const oddB = mercadoOdds?.oddB || 0;
    const oddOver25 = mercadoOdds?.oddOver25 || 0;
    const oddBTTS = mercadoOdds?.oddBTTS || 0;

    // --- IDENTIFICAÇÃO DE SUPER FAVORITO (Odd <= 1.40) E ULTRA FAVORITO (Odd < 1.30) ---
    const eSuperFavoritoA = oddA > 0 && oddA <= 1.40;
    const eSuperFavoritoB = oddB > 0 && oddB <= 1.40;
    const temSuperFavorito = eSuperFavoritoA || eSuperFavoritoB;

    const eUltraFavoritoA = oddA > 0 && oddA < 1.30;
    const eUltraFavoritoB = oddB > 0 && oddB < 1.30;

    const prob1X = Math.min(95, Math.round(vitoriaA + (taxaEmpateConfronto * 0.70)));
    const probX2 = Math.min(95, Math.round(vitoriaB + (taxaEmpateConfronto * 0.70)));
    const probDNB_A = Math.min(88, Math.round(vitoriaA + (taxaEmpateConfronto * 0.30)));
    const probDNB_B = Math.min(88, Math.round(vitoriaB + (taxaEmpateConfronto * 0.30)));

    // SEPARAÇÃO ESTRITA DOS MERCADOS EM DUAS CATEGORIAS
    const mercadosResultado = [];
    const mercadosGols = [];

    // 1. Categoria Resultado: Vitória Seca
    // Aceita faixa de odd 1.40-1.80 OU odds < 1.30 caso passe na análise estatística (>= 65%)
    if (vitoriaA >= 65 && (oddA === 0 || (oddA >= 1.40 && oddA <= 1.80) || eUltraFavoritoA)) {
        mercadosResultado.push({ id: "vit_a", nome: `Vitória ${nomeTimeA}`, probabilidade: vitoriaA });
    }
    if (vitoriaB >= 65 && (oddB === 0 || (oddB >= 1.40 && oddB <= 1.80) || eUltraFavoritoB)) {
        mercadosResultado.push({ id: "vit_b", nome: `Vitória ${nomeTimeB}`, probabilidade: vitoriaB });
    }

    // 2. Categoria Resultado: Dupla Chance (Mínimo 65%)
    if (prob1X >= 65) {
        mercadosResultado.push({ id: "dc_a", nome: `Dupla Chance: ${nomeTimeA} ou Empate (1X)`, probabilidade: prob1X });
    }
    if (probX2 >= 65) {
        mercadosResultado.push({ id: "dc_b", nome: `Dupla Chance: ${nomeTimeB} ou Empate (X2)`, probabilidade: probX2 });
    }

    // 3. Categoria Resultado: Empate Anula / DNB (Vitória base 55%-64% | DNB >= 65%)
    if (vitoriaA >= 55 && vitoriaA < 65 && probDNB_A >= 65) {
        mercadosResultado.push({ id: "dnb_a", nome: `Empate Anula - ${nomeTimeA}`, probabilidade: probDNB_A });
    }
    if (vitoriaB >= 55 && vitoriaB < 65 && probDNB_B >= 65) {
        mercadosResultado.push({ id: "dnb_b", nome: `Empate Anula - ${nomeTimeB}`, probabilidade: probDNB_B });
    }

    // 4. Categoria Gols: Over 2.5 (Mínimo 65% | Odd <= 1.85 | Over25 >= BTTS + 5%)
    if (over25 >= 65 && (oddOver25 === 0 || oddOver25 <= 1.85) && over25 >= (btts + 5)) {
        mercadosGols.push({ id: "over25", nome: "Over 2.5 Gols", probabilidade: over25 });
    }

    // 5. Categoria Gols: BTTS (Mínimo 65% | Odd <= 1.85 | MANTIDA TRAVA RIGOROSA EM SUPER FAVORITO)
    if (!temSuperFavorito && btts >= 65 && (oddBTTS === 0 || oddBTTS <= 1.85)) {
        mercadosGols.push({ id: "btts", nome: "Ambos Marcam (BTTS)", probabilidade: btts });
    }

    // Ordena cada categoria do maior para o menor percentual
    mercadosResultado.sort((a, b) => b.probabilidade - a.probabilidade);
    mercadosGols.sort((a, b) => b.probabilidade - a.probabilidade);

    const opcaoResultado = mercadosResultado[0];
    const opcaoGols = mercadosGols[0];

    const resultado = document.getElementById("resultado");

    // TRAVA RIGOROSA: Exibe o aviso se não houver opção qualificada dos DOIS lados (Resultado + Gols)
    if (!opcaoResultado || !opcaoGols) {
        resultado.innerHTML = `
            <h3>⚠️ Sem Seleção para Múltipla</h3>
            <p>O jogo não atingiu os critérios mínimos de probabilidade e margem de odd em ambas as categorias simultaneamente (Resultado + Gols).</p>
        `;
        return;
    }

    // Define a Opção 1 (Principal) como a de maior percentual individual
    let opcao1, opcao2;
    if (opcaoResultado.probabilidade >= opcaoGols.probabilidade) {
        opcao1 = opcaoResultado;
        opcao2 = opcaoGols;
    } else {
        opcao1 = opcaoGols;
        opcao2 = opcaoResultado;
    }

    const motivosOpcao1 = gerarMotivos(opcao1.nome, timeA, timeB, h2h, nomeTimeA, nomeTimeB, mercadoOdds);

    resultado.innerHTML = `
        <div class="resultado-top" style="border-left: 5px solid #ff9800; margin-bottom: 10px;">
            <strong>🧩 Opção 1 (Principal): ${opcao1.nome}</strong>
            <span class="probabilidade">${opcao1.probabilidade}%</span>
        </div>

        <div class="resultado-top" style="border-left: 5px solid #2196F3; background: #1e293b; margin-bottom: 15px;">
            <strong>🧩 Opção 2 (Complementar): ${opcao2.nome}</strong>
            <span class="probabilidade">${opcao2.probabilidade}%</span>
        </div>

        <div class="motivos-box">
            <h3>Motivos (Perna do Bilhete)</h3>
            <ul>
                ${motivosOpcao1.length > 0
            ? motivosOpcao1.map(m => `<li>${m}</li>`).join("")
            : "<li>✓ Seleção de alta probabilidade estatística para compor o bilhete.</li>"
        }
            </ul>
        </div>

        <div class="cards">
            <div class="card"><span>Vitória ${nomeTimeA}</span><strong>${vitoriaA}%</strong></div>
            <div class="card"><span>Vitória ${nomeTimeB}</span><strong>${vitoriaB}%</strong></div>
            <div class="card"><span>BTTS</span><strong>${btts}%</strong></div>
            <div class="card"><span>Over 2.5</span><strong>${over25}%</strong></div>
        </div>
    `;
}
// ======================================
// GERADOR DE MOTIVOS
// ======================================

function gerarMotivos(mercado, timeA, timeB, h2h, nomeTimeA, nomeTimeB, mercadoOdds = null) {
    const motivos = [];
    const mercadoLimpo = mercado.replace(" (H2H)", "").replace("⚔️ Sugestão via H2H + Mercado: ", "").trim();

    const oddA = mercadoOdds ? mercadoOdds.oddA : 0;
    const oddB = mercadoOdds ? mercadoOdds.oddB : 0;

    if (mercadoLimpo === "Ambos Marcam") {
        if (timeA.btts >= 60) motivos.push(`✓ ${nomeTimeA} teve BTTS em ${Math.round(timeA.btts)}% dos jogos`);
        if (timeB.btts >= 60) motivos.push(`✓ ${nomeTimeB} teve BTTS em ${Math.round(timeB.btts)}% dos jogos`);
        if (h2h.btts >= 60) motivos.push(`✓ H2H teve BTTS em ${Math.round(h2h.btts)}% dos confrontos`);
        if (timeA.mediaMarcados >= 1) motivos.push(`✓ ${nomeTimeA} marcou média de ${timeA.mediaMarcados.toFixed(1)} gols`);
        if (timeB.mediaMarcados >= 1) motivos.push(`✓ ${nomeTimeB} marcou média de ${timeB.mediaMarcados.toFixed(1)} gols`);
    }

    if (mercadoLimpo === "Over 2.5 Gols") {
        if (timeA.over25 >= 60) motivos.push(`✓ ${nomeTimeA} teve Over 2.5 em ${Math.round(timeA.over25)}% dos jogos`);
        if (timeB.over25 >= 60) motivos.push(`✓ ${nomeTimeB} teve Over 2.5 em ${Math.round(timeB.over25)}% dos jogos`);
        if (h2h.over25 >= 60) motivos.push(`✓ H2H teve Over 2.5 em ${Math.round(h2h.over25)}% dos confrontos`);
    }

    if (mercadoLimpo.includes(nomeTimeA)) {
        if (mercadoLimpo.includes("Empate Anula")) {
            motivos.push(`🛡️ Entrada protegida em caso de empate (DNB)`);
        } else if (oddA >= 1.30 && oddA <= 1.60) {
            motivos.push(`🎯 Odd de mercado (${oddA.toFixed(2)}) confirma alto favoritismo e aponta valor em Vitória Seca`);
        }

        if (timeA.forma > timeB.forma) motivos.push(`✓ ${nomeTimeA} possui melhor forma recente`);
        if (timeA.mediaMarcados > timeB.mediaMarcados) motivos.push(`✓ ${nomeTimeA} possui ataque mais eficiente`);
        if (timeA.mediaSofridos < timeB.mediaSofridos) motivos.push(`✓ ${nomeTimeA} possui defesa mais sólida`);
        if (h2h.vitoriaA > h2h.vitoriaB) motivos.push(`✓ ${nomeTimeA} leva vantagem nos confrontos diretos`);
    }

    if (mercadoLimpo.includes(nomeTimeB)) {
        if (mercadoLimpo.includes("Empate Anula")) {
            motivos.push(`🛡️ Entrada protegida em caso de empate (DNB)`);
        } else if (oddB >= 1.30 && oddB <= 1.60) {
            motivos.push(`🎯 Odd de mercado (${oddB.toFixed(2)}) confirma alto favoritismo e aponta valor em Vitória Seca`);
        }

        if (timeB.forma > timeA.forma) motivos.push(`✓ ${nomeTimeB} possui melhor forma recente`);
        if (timeB.mediaMarcados > timeA.mediaMarcados) motivos.push(`✓ ${nomeTimeB} possui ataque mais eficiente`);
        if (timeB.mediaSofridos < timeA.mediaSofridos) motivos.push(`✓ ${nomeTimeB} possui defesa mais sólida`);
        if (h2h.vitoriaB > h2h.vitoriaA) motivos.push(`✓ ${nomeTimeB} leva vantagem nos confrontos diretos`);
    }

    return motivos;
}
document.addEventListener("DOMContentLoaded", () => {
    const analisarBtn = document.getElementById("analisarBtn");
    if (analisarBtn) analisarBtn.addEventListener("click", analisarPartida);

    const h2hBtn = document.getElementById("h2hBtn");
    if (h2hBtn) h2hBtn.addEventListener("click", analisarApenasH2H);

    const limparBtn = document.getElementById("limparBtn");
    if (limparBtn) {
        limparBtn.addEventListener("click", () => {
            document.querySelectorAll("input").forEach(input => input.value = "");
            document.getElementById("resultado").innerHTML = "<p>Aguardando análise...</p>";
        });
    }

    const multiplaBtn = document.getElementById("multiplaBtn");
    if (multiplaBtn) multiplaBtn.addEventListener("click", gerarApostaMultipla);

    const testeBtn = document.getElementById("testeBtn");
    if (testeBtn) {
        testeBtn.addEventListener("click", () => {
            // Dados da Partida
            if (document.getElementById("timeA")) document.getElementById("timeA").value = "Flamengo";
            if (document.getElementById("timeB")) document.getElementById("timeB").value = "Palmeiras";

            // Odds do Mercado
            if (document.getElementById("oddA")) document.getElementById("oddA").value = "1.75";
            if (document.getElementById("oddEmpate")) document.getElementById("oddEmpate").value = "3.40";
            if (document.getElementById("oddB")) document.getElementById("oddB").value = "4.50";
            if (document.getElementById("oddOver25")) document.getElementById("oddOver25").value = "1.70";
            if (document.getElementById("oddBTTS")) document.getElementById("oddBTTS").value = "1.75";

            // Últimos 5 Jogos do Time A (Ataque forte + jogos movimentados)
            // Jogos: 3x1, 2x1, 3x2, 2x1, 3x0 -> Over 2.5 em 100% | BTTS em 80%
            const a_m = [3, 2, 3, 2, 3];
            const a_s = [1, 1, 2, 1, 0];

            // Últimos 5 Jogos do Time B (Marca com frequência, mas concede gols)
            // Jogos: 1x2, 2x1, 1x3, 2x2, 1x2 -> Over 2.5 em 100% | BTTS em 100%
            const b_m = [1, 2, 1, 2, 1];
            const b_s = [2, 1, 3, 2, 2];

            // H2H Histórico (Tendência forte de gols e ambas marcam)
            // Jogos: 2x1, 3x1, 2x1, 1x2, 3x1 -> Over 2.5 em 100% | BTTS em 100%
            const h_a = [2, 3, 2, 1, 3];
            const h_b = [1, 1, 1, 2, 1];

            for (let i = 1; i <= 5; i++) {
                if (document.getElementById(`a_m${i}`)) document.getElementById(`a_m${i}`).value = a_m[i - 1];
                if (document.getElementById(`a_s${i}`)) document.getElementById(`a_s${i}`).value = a_s[i - 1];
                if (document.getElementById(`b_m${i}`)) document.getElementById(`b_m${i}`).value = b_m[i - 1];
                if (document.getElementById(`b_s${i}`)) document.getElementById(`b_s${i}`).value = b_s[i - 1];
                if (document.getElementById(`h_a${i}`)) document.getElementById(`h_a${i}`).value = h_a[i - 1];
                if (document.getElementById(`h_b${i}`)) document.getElementById(`h_b${i}`).value = h_b[i - 1];
            }
        });
    }
});