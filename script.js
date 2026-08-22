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

    const totalJogos = jogos.length || 1;

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

// ======================================
// FUNÇÃO PRINCIPAL DE ANÁLISE
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

    const vitoriaA = calcularVitoriaTimeA(timeA, timeB, h2h, mercadoOdds);
    const vitoriaB = calcularVitoriaTimeB(timeA, timeB, h2h, mercadoOdds);

    let btts = calcularBTTS(timeA, timeB, h2h);
    let over25 = calcularOver25(timeA, timeB, h2h);

    const taxaEmpateConfronto = (timeA.taxaEmpate + timeB.taxaEmpate + h2h.empate) / 3;

    const ajustes = aplicarAjusteCompeticao(btts, over25, taxaEmpateConfronto, tipoCompeticao);
    btts = ajustes.btts;
    over25 = ajustes.over25;

    // Captura das Odds de Gols (0 se não preenchidas)
    const oddOver25 = mercadoOdds ? mercadoOdds.oddOver25 : 0;
    const oddBTTS = mercadoOdds ? mercadoOdds.oddBTTS : 0;

    const mercados = [];

    // --- TRAVA DE GOLS: Só entram se a Odd for <= 1.85 (ou sem odd informada) ---
    if (oddBTTS === 0 || oddBTTS <= 1.85) {
        mercados.push({ nome: "Ambos Marcam", probabilidade: btts });
    }

    if (oddOver25 === 0 || oddOver25 <= 1.85) {
        mercados.push({ nome: "Over 2.5 Gols", probabilidade: over25 });
    }

    const oddA = mercadoOdds ? mercadoOdds.oddA : 0;
    const oddB = mercadoOdds ? mercadoOdds.oddB : 0;

    // --- TIME A ---
    if (oddA >= 1.30 && oddA <= 1.70 && vitoriaA >= 65 && h2h.vitoriaA >= 40) {
        // Vitória Seca padrão (favorito/super favorito)
        mercados.push({ nome: `Vitória ${nomeTimeA}`, probabilidade: vitoriaA });
    } else if (oddA > 1.70 && vitoriaA >= 70) {
        // Vitória Seca em Odd mais alta (Valor alto + Confiança muito alta)
        mercados.push({ nome: `Vitória ${nomeTimeA}`, probabilidade: vitoriaA });
    } else if (vitoriaA >= 58) {
        // Proteção DNB para os demais casos com boa probabilidade
        const probDNB_A = Math.min(85, Math.round(vitoriaA + (taxaEmpateConfronto * 0.25)));
        mercados.push({ nome: `Empate Anula - ${nomeTimeA}`, probabilidade: probDNB_A });
    }

    // --- TIME B ---
    if (oddB >= 1.30 && oddB <= 1.70 && vitoriaB >= 65 && h2h.vitoriaB >= 40) {
        // Vitória Seca padrão
        mercados.push({ nome: `Vitória ${nomeTimeB}`, probabilidade: vitoriaB });
    } else if (oddB > 1.70 && vitoriaB >= 70) {
        // Vitória Seca em Odd mais alta
        mercados.push({ nome: `Vitória ${nomeTimeB}`, probabilidade: vitoriaB });
    } else if (vitoriaB >= 58) {
        // Proteção DNB
        const probDNB_B = Math.min(85, Math.round(vitoriaB + (taxaEmpateConfronto * 0.25)));
        mercados.push({ nome: `Empate Anula - ${nomeTimeB}`, probabilidade: probDNB_B });
    }

    const melhor = escolherMelhorAposta(mercados);
    const resultado = document.getElementById("resultado");

    // TRAVA DE SEGURANÇA: Se a lista estiver vazia ("Nenhuma") ou abaixo de 68%
    if (!melhor || melhor.nome === "Nenhuma" || melhor.probabilidade < 65) {
        resultado.innerHTML = `
            <h3>⚠️ Sem entrada recomendada</h3>
            <p>Confiança abaixo do limite de segurança (Mínimo: 68%) ou odds fora da margem segura. Maior encontrada: <strong>${melhor ? melhor.probabilidade : 0}%</strong></p>
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
// ANÁLISE EXCLUSIVA H2H
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

    let bttsH2H = Math.round(h2h.btts);
    let over25H2H = Math.round(h2h.over25);

    const ajustes = aplicarAjusteCompeticao(bttsH2H, over25H2H, taxaEmpateH2H, tipoCompeticao);
    bttsH2H = ajustes.btts;
    over25H2H = ajustes.over25;

    let probVitA = Math.round(h2h.vitoriaA);
    let probVitB = Math.round(h2h.vitoriaB);

    if (mercadoOdds) {
        probVitA = Math.round((mercadoOdds.probMercadoA * 0.65) + (probVitA * 0.35));
        probVitB = Math.round((mercadoOdds.probMercadoB * 0.65) + (probVitB * 0.35));
    }

    // Captura das Odds de Gols (0 se não preenchidas)
    const oddOver25 = mercadoOdds ? mercadoOdds.oddOver25 : 0;
    const oddBTTS = mercadoOdds ? mercadoOdds.oddBTTS : 0;

    const mercadosH2H = [];

    // --- TRAVA DUPLA NO H2H: Exige >= 80% E Odd <= 1.85 (ou sem odd informada) ---
    if (h2h.btts >= 80 && (oddBTTS === 0 || oddBTTS <= 1.85)) {
        mercadosH2H.push({ nome: "Ambos Marcam", probabilidade: bttsH2H });
    }

    if (h2h.over25 >= 80 && (oddOver25 === 0 || oddOver25 <= 1.85)) {
        mercadosH2H.push({ nome: "Over 2.5 Gols", probabilidade: over25H2H });
    }

    const oddA = mercadoOdds ? mercadoOdds.oddA : 0;
    const oddB = mercadoOdds ? mercadoOdds.oddB : 0;

    // --- TIME A (Versão H2H) ---
    if (oddA >= 1.30 && oddA <= 1.70 && probVitA >= 65 && h2h.vitoriaA >= 40) {
        mercadosH2H.push({ nome: `Vitória ${nomeTimeA}`, probabilidade: probVitA });
    } else if (oddA > 1.70 && probVitA >= 70) {
        mercadosH2H.push({ nome: `Vitória ${nomeTimeA}`, probabilidade: probVitA });
    } else if (probVitA >= 58) {
        const probDNB_A = Math.min(85, Math.round(probVitA + (taxaEmpateH2H * 0.25)));
        mercadosH2H.push({ nome: `Empate Anula - ${nomeTimeA}`, probabilidade: probDNB_A });
    }

    // --- TIME B (Versão H2H) ---
    if (oddB >= 1.30 && oddB <= 1.70 && probVitB >= 65 && h2h.vitoriaB >= 40) {
        mercadosH2H.push({ nome: `Vitória ${nomeTimeB}`, probabilidade: probVitB });
    } else if (oddB > 1.70 && probVitB >= 70) {
        mercadosH2H.push({ nome: `Vitória ${nomeTimeB}`, probabilidade: probVitB });
    } else if (probVitB >= 58) {
        const probDNB_B = Math.min(85, Math.round(probVitB + (taxaEmpateH2H * 0.25)));
        mercadosH2H.push({ nome: `Empate Anula - ${nomeTimeB}`, probabilidade: probDNB_B });
    }

    const melhorH2H = escolherMelhorAposta(mercadosH2H);
    const resultado = document.getElementById("resultado");

    // TRAVA DE SEGURANÇA: Bloqueia caso a lista fique vazia ("Nenhuma") ou abaixo de 68%
    if (!melhorH2H || melhorH2H.nome === "Nenhuma" || melhorH2H.probabilidade < 65) {
        resultado.innerHTML = `
            <h3>⚠️ H2H + Mercado Inconclusivo</h3>
            <p>Confiança abaixo do limite seguro para H2H (Mínimo: 68%) ou odds fora da margem estipulada. Maior encontrada: <strong>${melhorH2H ? melhorH2H.probabilidade : 0}%</strong></p>
        `;
        return;
    }

    const motivos = gerarMotivos(melhorH2H.nome, timeA_H2H, timeB_H2H, h2h, nomeTimeA, nomeTimeB, mercadoOdds);

    resultado.innerHTML = `
        <div class="resultado-top">
            <strong>⚔️ Sugestão via H2H + Mercado: ${melhorH2H.nome}</strong>
            <span class="probabilidade">${melhorH2H.probabilidade}%</span>
        </div>

        <div class="motivos-box">
            <h3>Motivos</h3>
            <ul>
                ${motivos.length > 0
            ? motivos.map(m => `<li>${m}</li>`).join("")
            : "<li>✓ Dados de confrontos diretos e odds de mercado favoráveis.</li>"
        }
            </ul>
        </div>

        <div class="cards">
            <div class="card"><span>Vitória ${nomeTimeA} (Ponderada)</span><strong>${probVitA}%</strong></div>
            <div class="card"><span>Vitória ${nomeTimeB} (Ponderada)</span><strong>${probVitB}%</strong></div>
            <div class="card"><span>BTTS (H2H)</span><strong>${bttsH2H}%</strong></div>
            <div class="card"><span>Over 2.5 (H2H)</span><strong>${over25H2H}%</strong></div>
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

// ======================================
// EVENT LISTENERS E UTILITÁRIOS
// ======================================

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

    const testeBtn = document.getElementById("testeBtn");
    if (testeBtn) {
        testeBtn.addEventListener("click", () => {
            document.getElementById("timeA").value = "Flamengo";
            document.getElementById("timeB").value = "Palmeiras";
            document.getElementById("oddA").value = "2.10";
            document.getElementById("oddEmpate").value = "3.20";
            document.getElementById("oddB").value = "3.50";

            // Preenchimento automático das novas odds de gols
            if (document.getElementById("oddOver25")) document.getElementById("oddOver25").value = "1.85";
            if (document.getElementById("oddBTTS")) document.getElementById("oddBTTS").value = "1.80";

            const a_m = [2, 1, 3, 0, 2];
            const a_s = [1, 0, 0, 1, 2];
            const b_m = [1, 2, 0, 1, 3];
            const b_s = [0, 1, 0, 2, 1];
            const h_a = [1, 2, 0, 2, 1];
            const h_b = [1, 0, 1, 2, 0];

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