import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for receiving base64 audio payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "A variável de ambiente GEMINI_API_KEY é obrigatória para este aplicativo."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// JSON schema for the response structure
const critiqueReportSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: {
      type: Type.INTEGER,
      description: "Uma nota geral de 0 a 100 para o poder de conversão saudável e respeito ao aposentado. Seja extremamente exigente e ranzinza."
    },
    overallVerdict: {
      type: Type.STRING,
      description: "Um veredito curto e brutal, ex: CATASTRÓFICO, VENDEDOR CHATO, AMADORISMO PURO, PAPO DE TELEMARKETING."
    },
    overallExplanation: {
      type: Type.STRING,
      description: "Uma descrição brutalmente honesta, ácida e direta sobre por que essa cópia falha miseravelmente em converter aposentados."
    },
    triggersCritique: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        score: { type: Type.INTEGER, description: "Nota específica de 0 a 100 para os gatilhos mentais aplicados." },
        triggerDensityScore: { type: Type.INTEGER, description: "Pontuação de 0 a 100 de densidade de gatilhos (saturação). Nota alta indica equilíbrio ideal; nota baixa indica ou excesso que sobrecarrega ou escassez que não persuasiona." },
        triggerDensityExplanation: { type: Type.STRING, description: "Crítica cirúrgica sobre a densidade de gatilhos empregados e o perigo de causar uma fadiga mental ou apatia no idoso." },
        points: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              triggerName: { type: Type.STRING, description: "Nome do gatilho analisado (pode ser genérico como Escassez, Urgência, Autoridade, etc., ou específico para o público maduro: Proteção Familiar, Segurança Institucional, Legado, Tranquilidade, Alívio Financeiro)" },
              triggerType: { type: Type.STRING, enum: ["absent", "weak", "misapplied", "overused"], description: "Categorização: se está ausente (deveria existir), se é fraco, mal aplicado ou usado em excesso." },
              originalQuote: { type: Type.STRING, description: "Trecho citado ou a indicação de onde deveria estar se estiver ausente." },
              critique: { type: Type.STRING, description: "Análise fria explicando por que o gatilho falhou, soou fraco, artificial ou gerou confusão." },
              solution: { type: Type.STRING, description: "Como reconstruir o trecho trazendo verdade, integridade e acerto na mentalidade do aposentado." }
            },
            required: ["triggerName", "triggerType", "originalQuote", "critique", "solution"]
          }
        }
      },
      required: ["title", "score", "triggerDensityScore", "triggerDensityExplanation", "points"]
    },
    ctaCritique: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        score: { type: Type.INTEGER, description: "Nota específica de 0 a 100 para a Chamada para Ação (CTA)." },
        originalQuote: { type: Type.STRING, description: "Trecho exato do CTA atual." },
        critique: { type: Type.STRING, description: "Crítica devastadora sobre a fragilidade deste CTA (ex: confuso, solicita passos digitais complexos fora da realidade do aposentado, falta clareza e comando único)." },
        solution: { type: Type.STRING, description: "Como reformular o CTA para ser impossível do pensionista recusar, detalhando passos que respeitam suas limitações cognitivas ou medos de golpes digitais." }
      },
      required: ["title", "score", "originalQuote", "critique", "solution"]
    },
    ctaContextAnalysis: {
      type: Type.OBJECT,
      description: "Análise contextual da chamada para ação (CTA). Avalia se o CTA está prematuro ou se foi contextualizado devidamente com o desejo e tratamento de objeções antes dele.",
      properties: {
        isPremature: { 
          type: Type.BOOLEAN, 
          description: "Define se o CTA foi introduzido cedo demais (antes de construir o desejo ou antecipar as objeções do cliente)." 
        },
        desireBuiltBeforeCTA: { 
          type: Type.INTEGER, 
          description: "Uma pontuação de 0 a 100 medindo quão bem o desejo/valor foi construído antes de o CTA ser verbalizado ou exibido." 
        },
        objectionHandlingBeforeCTA: { 
          type: Type.INTEGER, 
          description: "Uma pontuação de 0 a 100 sobre quão efetiva foi a antecipação e tratamento de objeções antes do fechamento." 
        },
        contextualCoherence: { 
          type: Type.STRING, 
          description: "Análise discursiva fria e cirúrgica sobre a coerência do fechamento. Explique se o CTA ficou órfão (sem base emocional) ou se foi bem preparado estrategicamente para o público do INSS." 
        }
      },
      required: ["isPremature", "desireBuiltBeforeCTA", "objectionHandlingBeforeCTA", "contextualCoherence"]
    },
    headspaceBreaks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Título do ponto de quebra, ex: Jargão bancário assustador, Medo de fraude por link, Gatilho de urgência fajuto, Falta de acolhimento" },
          originalQuote: { type: Type.STRING, description: "A frase ou o trecho que empurra o aposentado do INSS para fora do funil / desliga o interesse." },
          whyItBreaks: { type: Type.STRING, description: "Análise psicológica profunda de por que esse trecho destrói o headspace (espaço mental) e gera recuo imediato (medo de golpes)." },
          retireeReaction: { type: Type.STRING, description: "O pensamento interno real e defensivo que o aposentado tem ao ouvir isso." },
          solution: { type: Type.STRING, description: "A reformulação perfeita para este ponto que mantém a segurança, o respeito e ocupa espaço seguro na mente deles." }
        },
        required: ["title", "originalQuote", "whyItBreaks", "retireeReaction", "solution"]
      }
    },
    makeover: {
      type: Type.OBJECT,
      properties: {
        hook: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            replacement: { type: Type.STRING },
            why: { type: Type.STRING }
          },
          required: ["original", "replacement", "why"]
        },
        body: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            replacement: { type: Type.STRING },
            why: { type: Type.STRING }
          },
          required: ["original", "replacement", "why"]
        },
        cta: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            replacement: { type: Type.STRING },
            why: { type: Type.STRING }
          },
          required: ["original", "replacement", "why"]
        },
        completeNewScript: {
          type: Type.STRING,
          description: "O script de vendas inteiro, reformulado de ponta a ponta em linguagem brasileira, pronto para gravação de áudio ou telemarketing de alta conversão. Pauta extrema segurança, acolhimento pular jargão forçado e clareza no próximo passo."
        }
      },
      required: ["hook", "body", "cta"]
    },
    voiceAnalysis: {
      type: Type.OBJECT,
      description: "Análise crítica do comportamento vocal, tom, velocidade e calor humano (empatia profissional) necessários para o público aposentado/pensionista.",
      properties: {
        toneFeedback: {
          type: Type.STRING,
          description: "Feedback impiedoso e detalhado sobre o tom de voz usado ou implícito no script. Idosos aborrecem-se com tons prepotentes, ultra-vendedores, forçados ou condescendentes. Precisa soar respeitoso, maduro e calmo."
        },
        paceFeedback: {
          type: Type.STRING,
          description: "Análise do ritmo e velocidade (tempo). A velocidade ideal com idosos é pausada, compassada e segura. Ritmo acelerado/ansioso cheira a golpe mental de telemarketing."
        },
        warmthEvaluation: {
          type: Type.STRING,
          description: "Análise da empatia e profissionalismo transmitido. Criticar frieza, falta de compaixão natural, robotização ou intimidação corporativa."
        },
        generalScore: {
          type: Type.INTEGER,
          description: "Uma pontuação rígida de 0 a 100 para o desempenho vocal ou entonação requerida."
        }
      },
      required: ["toneFeedback", "paceFeedback", "warmthEvaluation", "generalScore"]
    },
    narrativeStructure: {
      type: Type.OBJECT,
      description: "Análise de integridade estrutural narrativa (Abertura/Hook, Desenvolvimento/Tensão, Fluxo Lógico e Pacing) para garantir a melhor sequência de persuasão para o público do INSS.",
      properties: {
        hookEffectiveness: {
          type: Type.OBJECT,
          description: "Análise da força do Hook (primeiros 7 segundos) e se capta atenção de forma respeitosa ou se parece agressivo ou desinteressante.",
          properties: {
            score: { type: Type.INTEGER },
            critique: { type: Type.STRING }
          },
          required: ["score", "critique"]
        },
        tensionBuilding: {
          type: Type.OBJECT,
          description: "Análise de como o script constrói desejo ou tensão de forma progressiva antes de apresentar a solução comercial.",
          properties: {
            score: { type: Type.INTEGER },
            critique: { type: Type.STRING }
          },
          required: ["score", "critique"]
        },
        logicalFlow: {
          type: Type.OBJECT,
          description: "Análise da sequência e lógica de vendas (Fluxo Lógico). Se pede ação ou passa o valor no momento correto, ou se atropela o senso de segurança do cliente.",
          properties: {
            score: { type: Type.INTEGER },
            critique: { type: Type.STRING }
          },
          required: ["score", "critique"]
        },
        pacingIssues: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de problemas específicos sobre o ritmo, cadência ou transições truncadas na história/pitch."
        }
      },
      required: ["hookEffectiveness", "tensionBuilding", "logicalFlow", "pacingIssues"]
    },
    emotionalJourneyMap: {
      type: Type.OBJECT,
      description: "Mapeamento preditivo e antecipado da jornada emocional do idoso do INSS, comparando as intenções do roteiro com a realidade biológica e psicológica e as lacunas dramáticas.",
      properties: {
        intendedEmotions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "As emoções que o script tenta fazer o aposentado sentir, de acordo com o design pretendido do vendedor (ex: Alívio imediato, Reciprocidade, Confiança cega, Curiosidade)."
        },
        actualEmotions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "As emoções que o script realmente faz o aposentado sentir baseado no medo de fraudes e na exaustão (ex: Desconfiança instintiva, Ansiedade, Irritação de telemarketing, Indiferença)."
        },
        emotionalGaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "As falhas ou lacunas de empatia (onde e por que a emoção que se tentou evocar deu errado e causou rejeição crônica no aposentado)."
        }
      },
      required: ["intendedEmotions", "actualEmotions", "emotionalGaps"]
    },
    objectionHandling: {
      type: Type.OBJECT,
      description: "Análise preditiva de tratamento de objeções de segurança, usabilidade ou familiares específicas do idoso (ex: 'É golpe?', 'Não entendo de tecnologia', 'Preciso falar com meu filho', 'Já fui enganado antes').",
      properties: {
        anticipatedObjections: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Objeções críticas e naturais que este roteiro inevitavelmente desperta por lidar com o público do INSS e que deveriam ser neutralizadas no decorrer da copy."
        },
        addressedObjections: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "As objeções que o script de fato enfrentou ou tentou responder direta ou indiretamente."
        },
        missingObjections: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Objeções críticas urgentes que foram totalmente menosprezadas ou ignoradas pelo roteiro, gerando silêncio fatal para o cliente."
        },
        objectionHandlingScore: {
          type: Type.INTEGER,
          description: "Nota de 0 a 100 avaliando o amparo intelectual de segurança e clareza para derreter as objeções e o medo do idoso."
        }
      },
      required: ["anticipatedObjections", "addressedObjections", "missingObjections", "objectionHandlingScore"]
    },
    makeoverStrategy: {
      type: Type.OBJECT,
      description: "Estratégia por trás das mudanças no script remodelado. Explica por que mudar certas partes e como priorizar essas melhorias.",
      properties: {
        coreStrategicChanges: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Mudanças estratégicas fundamentais implementadas no roteiro reescrito e a fundamentação psicológica ou princípio de persuasão por trás de cada uma."
        },
        optionalImprovements: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Melhorias adicionais secundárias recomendadas que agregam valor mas são opcionais (nice-to-have)."
        },
        priorityRanking: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A recomendação da ordem de importância e prioridade extrema das mudanças a serem feitas pelo operador ou copywriter (do mais urgente e crítico para o menos crítico)."
        }
      },
      required: ["coreStrategicChanges", "optionalImprovements", "priorityRanking"]
    },
    transcription: {
      type: Type.STRING,
      description: "A transcrição completa aproximada do áudio, caso tenha sido enviado um áudio para análise."
    }
  },
  required: ["overallScore", "overallVerdict", "overallExplanation", "triggersCritique", "ctaCritique", "ctaContextAnalysis", "headspaceBreaks", "makeover", "voiceAnalysis", "narrativeStructure", "emotionalJourneyMap", "objectionHandling", "makeoverStrategy"]
};

// API Endpoint for critique generation
app.post("/api/evaluate", async (req, res): Promise<any> => {
  try {
    const { type, textScript, audioBase64, audioMimeType, subAudienceDetail } = req.body;

    if (type === "text" && !textScript) {
      return res.status(400).json({ error: "É necessário fornecer o texto do script para análise textual." });
    }

    if (type === "audio" && (!audioBase64 || !audioMimeType)) {
      return res.status(400).json({ error: "É necessário fornecer arquivo ou gravação de áudio e seu tipo MIME correto." });
    }

    const ai = getAiClient();
    const systemPrompt = `Você é um Copywriter Sênior de extrema elite, implacavelmente ranzinza, ríspido, rústico e brutalmente honesto. Sua especialidade é dissecar scripts de vendas e telemarketing voltados ao público de APOSENTADOS E PENSIONISTAS DO INSS brasileiro (uma audiência com altíssima resistência a golpes, cansada de assédio por telemarketing Bancário, carente de clareza, respeito e que reage agressivamente a gatilhos bobos de internet de 'comprar rápido' ou termos em inglês como link, CTA, push).

Sua tarefa é avaliar criticamente o script ou áudio de vendas fornecido sob frentes principais absolutamente obrigatórias:
1. GATILHOS DE ABORDAGEM: Identifique e avalie o uso de gatilhos mentais. 
   - Classifique cada gatilho sob um 'triggerType': "absent" (importante e deveria estar lá, mas foi esquecido), "weak" (tentou aplicar mas ficou superficial), "misapplied" (mal aplicado, agressivo, abusivo ou desrespeitoso), ou "overused" (saturado no script, gerando poluição comercial).
   - Analise tanto os gatilhos genéricos (Escassez, Urgência, Autoridade) quanto, obrigatoriamente, os gatilhos específicos cruciais para a mente do Aposentado: "Proteção Familiar", "Segurança Institucional", "Legado", "Tranquilidade", e "Alívio Financeiro".
   - Avalie o 'triggerDensityScore' (0-100) calibrando se há saturação de argumentos ou escassez absoluta. Uma pontuação alta (ex. 85-95) reflete o equilíbrio ideal que não causa fadiga cognitiva eletrônica no idoso. Pontuações muito baixas refletem ou excesso sufocante de gatilhos idiotas ou secura persuasiva.
   - Escreva a 'triggerDensityExplanation' explicando as consequências psicológicas desse nível de saturação para o idoso do INSS.
2. CTA FRACO: Analisar onde a chamada de ação falha (complexa demais, pede pra clicar em link suspeito, dá opções demais pro idoso, não passa segurança nem proximidade pessoal humana).
3. ANÁLISE CONTEXTUAL DA CHAMADA PARA AÇÃO (CTA CONTEXT ANALYSIS):
   Avalie se o chamado para ação (CTA) está num momento oportuno ou prematuro dentro da narrativa. Um CTA só se sustenta estrategicamente se:
   - Não for prematuro (isPremature): sinalize se o operador pede ação (ex. clicar em link, passar dados) antes de sequer construir valor ou tratar objeções biológicas de medo de golpes.
   - O desejo do produto foi devidamente edificado antes do fechamento (desireBuiltBeforeCTA, nota 0 a 100).
   - As dores, dúvidas ou objeções típicas do público idoso foram antecipadas e acalmadas antes do CTA (objectionHandlingBeforeCTA, nota 0 a 100).
   - Discorra detalhadamente em 'contextualCoherence' se o final do pitch ficou órfão (sem lastro existencial ou sem proximidade terna que convença a ação física útil do idoso).
4. QUEBRAS DE CONEXÃO NO HEADSPACE: Identificar onde o vendedor sai da cabeça do aposentado (ex: usa termos técnicos intimidadores, demonstra ganância estridente, ou jargão de marketing digital que destrói a confiança).
5. COMPORTAMENTO VOCAL, TOM E VELOCIDADE (VOICE ANALYSIS):
   Se o arquivo enviado for um ÁUDIO, você deve escutar a entonação do locutor e realizar um diagnóstico profundo do áudio:
   - TOM DE VOZ (Tone Feedback): Avalie se soa como um robô corporativo frio, um vendedor desesperado 'sorridente demais' (falsa simpatia/falso fofo que idosos farejam à distância), agressivo nas cobranças/pressões, ou se tem o respeito maduro e calmo necessário.
   - RITMO E VELOCIDADE (Pace Feedback): Avalie os picos de pressa. Explicar ofertas a idosos necessita de pausas táticas (pausa após citar valores, escuta ativa, ritmo compassado). Falar rápido demais causa ansiedade severa no idoso e ativa o alarme biológico de golpista de WhatsApp.
   - CALOR HUMANO E EMPATIA PROFISSIONAL (Warmth Evaluation): Avalie se há conexão emocional genuína ou se a abordagem parece um despacho mecânico para livrar-se do contrato. Aposentados necessitam de cordialidade ritualística ('Seu', 'Dona', tom paternal protetivo sem ser paternalista).
   - Se o arquivo enviado for apenas um TEXTO, analise a efervescência sugerida, a pontuação, o ritmo implícito que a leitura forçará no operador e como a voz precisará ser lapidada para não soar invasiva.
6. ESTRUTURA NARRATIVA (STORYTELLING AND NARRATIVE STRUCTURE):
   Analise a jornada narrativa do script como um todo orgânico e sequencial. Avalie:
   - EFICÁCIA DO GANCHO (hookEffectiveness): O gancho captura a atenção de forma respeitosa nos primeiros 7 segundos ou já entrega cara de telemarketing? Forneça uma nota de 0 a 100 e uma crítica ácida.
   - CONSTRUÇÃO DE TENSÃO/DESEJO (tensionBuilding): O script gera valor e constrói o desejo de forma progressiva antes de empurrar a oferta, ou é apressado demais? Forneça uma nota de 0 a 100 e uma crítica ácida.
   - FLUXO LÓGICO DE ARGUMENTAÇÃO (logicalFlow): A ordem dos fatores faz sentido lógico para uma mente mais madura e prevenida contra fraudes? Por exemplo, pedir ação ou passar o valor antes de criar confiança é catastrófico. A sequência está correta ou atropelada? Forneça uma nota de 0 a 100 e uma crítica ácida.
   - RITMO DO PACING (pacingIssues): Liste problemas do andamento da conversa (transições bruscas, silêncios ruins, discursos cansativos demais).
7. JORNADA EMOCIONAL E LACUNAS DE EMPATIA (EMOTIONAL JOURNEY MAP):
   Mapeie o fluxo emocional do aposentado ao interagir com essa abordagem de forma preditiva. Avalie:
   - EMOÇÕES PRETENDIDAS (intendedEmotions): O que o script tenta fazer o aposentado sentir (ex: Amparo, Alívio do endividamento, Urgência saudável, Prevenção)?
   - EMOÇÕES REAIS (actualEmotions): O que a falta de clareza, os truques ou os gatilhos ruins fazem ele realmente sentir (ex: Angústia, Medo de golpe de WhatsApp, Perplexidade, Desconfiança profunda)?
   - LACUNAS EMOCIONAIS (emotionalGaps): Identifique onde a emoção pretendida falha dramaticamente por falta de autenticidade, calor humano ou escuta real do operador. Explique com detalhes ácidos a discrepância emocional.
8. TRATAMENTO DE OBJEÇÕES PSICOLÓGICAS E BIOLÓGICAS (OBJECTION HANDLING):
   Aposentados do INSS carregam medos profundos de golpes, fraudes, complexidade tecnológica e desconfiança de estranhos por telefone. Mapeie preditivamente como o roteiro antecipa e neutraliza essas barreiras cruciais de persuasão:
   - OBJEÇÕES QUE DEVERIA ANTECIPAR (anticipatedObjections): O que a oferta ou o contato telefônico inevitavelmente provoca na mente cética do aposentado (ex: "É golpe?", "Tenho medo de telefone / WhatsApp", "Preciso falar com meu filho primeiro", "Não entendo nada de tecnologia", "Já fui enganado por um banco antes").
   - OBJEÇÕES REALMENTE CONTORNADAS (addressedObjections): Liste quais dessas objeções e medos o roteiro de fato tentou contornar ou desarmar, tácita ou explicitamente.
   - OBJEÇÕES CRÍTICAS IGNORADAS (missingObjections): Liste os furos defensivos gravíssimos que ficaram completamente esquecidos pelo roteiro, gerando silêncio fatal que faria o idoso desligar ou travar a conversa.
   - NOTA DE TRATAMENTO DE OBJEÇÕES (objectionHandlingScore, 0 a 100): Uma nota avaliando a maturidade psicológica profunda do script na criação preventiva de um ambiente seguro e blindado contra pânicos de golpes ou fraudes digitais do idoso.
 9. PLANO DE MAKEOVER ESTRATÉGICO (MAKEOVER STRATEGY):
   Explane a estratégia por trás do roteiro remodelado sob os seguintes pilares:
   - MUDANÇAS ESTRATÉGICAS FUNDAMENTAIS (coreStrategicChanges): Descreva as mudanças fundamentais feitas e o princípio persuasivo ou justificativa psicológica que justificou cada uma.
   - MELHORIAS SECUNDÁRIAS (optionalImprovements): Liste melhorias incrementais acessórias recomendadas ("nice-to-have") que podem ser acrescidas opcionalmente.
   - RANKING DE PRIORIDADES (priorityRanking): Classifique e ordene por ordem de urgência extrema de correção quais pontos o operador precisa pivotar ou reescrever de imediato.

Adote o tom de quem fala 'a verdade nua e crua'. Não suavize uma única letra. Criticar de forma construtiva significa expor a mediocridade do roteiro sem pudor para que eles parem de queimar lista de contatos.

Você DEVE estruturar o resultado final estritamente no formato JSON fornecido pela configuração de schema. Escreva todos os textos em PORTUGUÊS fluente do Brasil, vívido, contundente, sério e com alta riqueza técnica de copywriting.`;

    // Construct request parts
    const parts: any[] = [];

    let promptContent = "";
    if (type === "audio") {
      promptContent = `Aqui está o áudio de vendas focado em aposentados do INSS (${subAudienceDetail || "Geral"}). Por favor, primeiro faça a transcrição textual exata dele. Em seguida, dissete brutalmente este script em todos os pontos focais do sistema, gerando o relatório JSON de crítica severa.`;
      
      parts.push({
        inlineData: {
          mimeType: audioMimeType,
          data: audioBase64
        }
      });
    } else {
      promptContent = `Aqui está o roteiro de copy escrito para áudio/telemarketing focado em aposentados do INSS (${subAudienceDetail || "Geral"}):

--- SCRIPT DE COPY ---
${textScript}
--- SCRIPT DE COPY ---

Frite este script sem piedade. Forneça a análise baseando-se estritamente nos pontos focais solicitados.`;
    }

    parts.push({ text: promptContent });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: critiqueReportSchema,
        temperature: 0.3, // Temperature 0.3 for Technical assessment: scores, structural critiques
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("O modelo Gemini retornou uma resposta nula ou inválida.");
    }

    const report = JSON.parse(resultText);

    // Call 2: Generate completeNewScript using temperature 0.9 for creative and vivid copy rewriting
    const scriptForRewrite = type === "audio" ? (report.transcription || "") : textScript;
    const secondPrompt = `Você é um Copywriter Sênior de extrema elite, implacavelmente ranzinza, mas magistral nas palavras. Sua tarefa é reescrever o script de vendas inteiro de forma brilhante e altamente persuasiva para aposentados do INSS, corrigindo todos os problemas identificados.
    
--- SCRIPT ORIGINAL / TRANSCRIÇÃO ---
${scriptForRewrite || "Roteiro fornecido por áudio"}
-------------------------------------

--- ANÁLISE TÉCNICA E CRÍTICAS CONTEXTUAIS ---
* Score Geral: ${report.overallScore}/100
* Veredito Geral: ${report.overallVerdict}
* Críticas Gerais: ${report.overallExplanation}
* Reformulação do Hook sugerida: ${report.makeover?.hook?.replacement || ""}
* Reformulação do Corpo sugerida: ${report.makeover?.body?.replacement || ""}
* Reformulação do CTA sugerida: ${report.makeover?.cta?.replacement || ""}
----------------------------------

Por favor, escreva o script de vendas inteiro, reformulado de ponta a ponta em linguagem brasileira, pronto para gravação de áudio ou telemarketing de alta conversão. Ele deve ser extremamente acolhedor, seguro, sem jargões corporativos complicados / marketing digital forçado, extremamente claro no próximo passo, e com tom paternal protetor sem ser condescendente.

Retorne APENAS o script de vendas reescrito final, sem comentários adicionais, sem preâmbulo, sem "Aqui está o roteiro", sem avisos markdown no início.`;

    const response2Text = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: secondPrompt }
      ],
      config: {
        temperature: 0.9, // Higher temperature for copywriting re-writing creativity
      }
    });

    const rewriteResult = response2Text.text?.trim() || "";
    if (report.makeover) {
      report.makeover.completeNewScript = rewriteResult;
    } else {
      report.makeover = {
        hook: { original: "", replacement: "", why: "" },
        body: { original: "", replacement: "", why: "" },
        cta: { original: "", replacement: "", why: "" },
        completeNewScript: rewriteResult
      };
    }

    res.json(report);
  } catch (error: any) {
    console.error("Erro na rota /api/evaluate:", error);
    res.status(500).json({
      error: error.message || "Erro desconhecido ao processar a avaliação crítica do áudio."
    });
  }
});

// Setup Vite Dev Server / Serve production code
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server HTTP rodando em 0.0.0.0:${PORT} [NODE_ENV=${process.env.NODE_ENV || "development"}]`);
  });
}

startServer();
