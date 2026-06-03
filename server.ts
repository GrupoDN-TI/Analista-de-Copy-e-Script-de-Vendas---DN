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
        points: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              triggerName: { type: Type.STRING, description: "Nome do gatilho tentado (ex: Escassez, Urgência, Autoridade, Prova Social, Reciprocidade, Novidade)" },
              originalQuote: { type: Type.STRING, description: "Trecho exato citado da copy onde foi tentado o gatilho." },
              critique: { type: Type.STRING, description: "Análise fria e cirúrgica explicando por que o gatilho soa fraco, falso, manipulador ou forçado para o idoso do INSS." },
              solution: { type: Type.STRING, description: "Como reformular esse trecho aplicando o gatilho de forma madura, segura, transparente e altamente eficaz." }
            },
            required: ["triggerName", "originalQuote", "critique", "solution"]
          }
        }
      },
      required: ["title", "score", "points"]
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
      required: ["hook", "body", "cta", "completeNewScript"]
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
    transcription: {
      type: Type.STRING,
      description: "A transcrição completa aproximada do áudio, caso tenha sido enviado um áudio para análise."
    }
  },
  required: ["overallScore", "overallVerdict", "overallExplanation", "triggersCritique", "ctaCritique", "headspaceBreaks", "makeover", "voiceAnalysis"]
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
1. GATILHOS FRÁGEIS: Mostrar onde e por que o uso de gatilhos mentais (ex: escassez fajuta, falsa urgência, autoridade forçada) é infantil, frágil e insulta a inteligência do aposentado do INSS, explicando os motivos psicológicos exatos.
2. CTA FRACO: Analisar onde a chamada de ação falha (complexa demais, pede pra clicar em link suspeito, dá opções demais pro idoso, não passa segurança nem proximidade pessoal humana).
3. QUEBRAS DE CONEXÃO NO HEADSPACE: Identificar onde o vendedor sai da cabeça do aposentado (ex: usa termos técnicos intimidadores, demonstra ganância estridente, ou jargão de marketing digital que destrói a confiança).
4. COMORTAMENTO VOCAL, TOM E VELOCIDADE (VOICE ANALYSIS):
   Se o arquivo enviado for um ÁUDIO, você deve escutar a entonação do locutor e realizar um diagnóstico profundo do áudio:
   - TOM DE VOZ (Tone Feedback): Avalie se soa como um robô corporativo frio, um vendedor desesperado 'sorridente demais' (falsa simpatia/falso fofo que idosos farejam à distância), agressivo nas cobranças/pressões, ou se tem o respeito maduro e calmo necessário.
   - RITMO E VELOCIDADE (Pace Feedback): Avalie os picos de pressa. Explicar ofertas a idosos necessita de pausas táticas (pausa após citar valores, escuta ativa, ritmo compassado). Falar rápido demais causa ansiedade severa no idoso e ativa o alarme biológico de golpista de WhatsApp.
   - CALOR HUMANO E EMPATIA PROFISSIONAL (Warmth Evaluation): Avalie se há conexão emocional genuína ou se a abordagem parece um despacho mecânico para livrar-se do contrato. Aposentados necessitam de cordialidade ritualística ('Seu', 'Dona', tom paternal protetivo sem ser paternalista).
   - Se o arquivo enviado for apenas um TEXTO, analise a efervescência sugerida, a pontuação, o ritmo implícito que a leitura forçará no operador e como a voz precisará ser lapidada para não soar invasiva.

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
        temperature: 1.0, // High temperature brings maximum raw, vivid prose
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("O modelo Gemini retornou uma resposta nula ou inválida.");
    }

    const report = JSON.parse(resultText);
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
