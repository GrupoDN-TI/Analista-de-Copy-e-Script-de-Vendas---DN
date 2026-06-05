import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Upload,
  FileAudio,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Copy,
  RotateCcw,
  Target,
  BrainCircuit,
  CornerDownRight,
  ShieldAlert,
  Flame,
  Volume2,
  FileText,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  HeartHandshake,
  Download
} from "lucide-react";
import { jsPDF } from "jspdf";
import { CritiqueReport } from "./types";

// Suggested preset templates for immediate demo analysis to keep it friction-free!
const SCRIPTS_DEMO = [
  {
    subAudience: "Refinanciamento",
    title: "Script Refin: Urgência falsa e Termos Técnicos em excesso",
    text: "Alô, Seu Francisco! Aqui é o Eduardo do banco líder, tudo bem? Olha só, corre aqui porque o sistema liberou uma taxa imperdível de refinanciamento do seu consignado, mas só vale para as próximas 2 horas por causa do lote do INSS que vai fechar! É só clicar no link de assinatura digital rápida que te mandei no Whats. Super prático, em segundos você assina e o troco cai em 24h na conta cadastrada. Vamos fechar logo antes que o robô tire o desconto de você!"
  },
  {
    subAudience: "Portabilidade de Crédito",
    title: "Script Portabilidade: Escassez forçada e CTA confuso",
    text: "Olá dona Maria, sou consultor credenciado do INSS. Identifiquei que a senhora está pagando juros abusivos no seu contrato atual. Nós somos a maior autoridade nacional em redução de juros. Consigo reduzir sua parcela hoje e te devolver um saldo em dinheiro. Mas para isso acontecer, a senhora precisa baixar o nosso aplicativo oficial na PlayStore, tirar uma selfie olhando para cima e fazer o upload do extrato detalhado do seu benefício de preferência compactado em formato PDF. É rapidinho, faz agora para não perder a vez!"
  },
  {
    subAudience: "Novo Benefício",
    title: "Script Novo Cartão: Abordagem invasiva de assédio",
    text: "Parabéns, senhor Roberto! Acaba de sair a aprovação oficial do seu benefício de aposentadoria INSS, o lote de saque imediato de 8 mil reais já está reservado no seu nome! Para liberar esse voucher premium e o cartão de benefícios exclusivo da nossa instituição financeira parceira, eu preciso confirmar se o senhor é o titular do benefício mesmo. Me passe por favor os seus dados pessoais, CPF, RG e o número da folha de pagamento para eu validar antes que o lote expire!"
  }
];

const SUB_AUDIENCE_PROFILES = [
  {
    id: "Geral",
    name: "Geral (Aposentados & Pensionistas)",
    insight: "Gosta de respeito ritualístico, clareza absoluta, abomina urgência boba de internet e teme golpes bancários.",
  },
  {
    id: "GovernoMG",
    name: "Governo de Minas Gerais",
    insight: "Perfil cauteloso, margem rígida de 30%, requer conformidade estrita.",
  },
  {
    id: "GovernoPR",
    name: "Governo do Paraná",
    insight: "Fortemente bairrista, valoriza instituições regionais sólidas.",
  },
  {
    id: "GovernoSC",
    name: "Governo de Santa Catarina",
    insight: "Extremamente conservador financeiramente, exige dados matemáticos concretos.",
  },
  {
    id: "SIAPE",
    name: "Servidores Federais (SIAPE)",
    insight: "Analítico, alto nível de exigência técnica, busca otimização financeira.",
  },
  {
    id: "Refinanciamento",
    name: "Refinanciamento de Empréstimo",
    insight: "Sabe como funciona o troco e odeia sentir que está sendo enganado com taxas maquiadas.",
  },
  {
    id: "Portabilidade de Crédito",
    name: "Portabilidade de Consignado",
    insight: "Quer parcelas menores, ou liquidez imediata, mas tem medo de assinar um contrato e travar o benefício por pura malícia.",
  },
  {
    id: "Novo Benefício",
    name: "Novo Cartão / Beneficiário recente",
    insight: "Assediado por 50 bancos no primeiro dia. Perfil de cliente que costuma ser extremamente desconfiado e assustado com vazamento de dados.",
  },
  {
    id: "Margem Consignável Livre",
    name: "Margem Consignável Livre",
    insight: "Visto como 'ouro' pelas promotoras. Quer o dinheiro, mas sem burocracia ou promessas mirabolantes."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"upload" | "record" | "text">("text");
  const [textScript, setTextScript] = useState("");
  const [subAudience, setSubAudience] = useState("Geral");
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [critiqueResult, setCritiqueResult] = useState<CritiqueReport | null>(null);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // File states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  // UI state for showing copy feedback
  const [copiedScript, setCopiedScript] = useState(false);

  // Live recording duration counter
  useEffect(() => {
    if (isRecording) {
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [isRecording]);

  // Generate beautiful, pagination-aware A4 PDF report with jsPDF
  const generatePDFReport = () => {
    if (!critiqueResult) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageHeight = 297;
    const pageWidth = 210;
    const margin = 20;
    let y = 25;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = 25;
        // Elegant header line on subsequent pages
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text("FRITADEIRA DE COPIES DO INSS — RELATÓRIO DE AUDITORIA", margin, 12);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(margin, 14, pageWidth - margin, 14);
        doc.setFont("Helvetica", "normal");
      }
    };

    const printParagraph = (text: string, fontSize = 9.5, style = "normal", color = [51, 65, 85]) => {
      doc.setFont("Helvetica", style);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines: string[] = doc.splitTextToSize(text, pageWidth - 2 * margin);
      for (const line of lines) {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 5;
      }
      y += 1.5; // space after paragraph
    };

    const printBullet = (label: string, text: string, listColor = [15, 23, 42]) => {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(listColor[0], listColor[1], listColor[2]);
      checkPageBreak(5);
      doc.text("• " + label + ":", margin, y);
      
      const labelWidth = doc.getTextWidth("• " + label + ": ") + 1;
      const textWidthLimit = pageWidth - 2 * margin - labelWidth;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105); // slate-600

      const textLines: string[] = doc.splitTextToSize(text, textWidthLimit);
      if (textLines.length > 0) {
        // print first line right next to label
        doc.text(textLines[0], margin + labelWidth, y);
        y += 5;
        
        // print secondary lines indented for optimal layout alignment
        for (let i = 1; i < textLines.length; i++) {
          checkPageBreak(5);
          doc.text(textLines[i], margin + 6, y);
          y += 5;
        }
      } else {
        y += 5;
      }
      y += 1;
    };

    const printSectionHeader = (title: string, color = [30, 41, 59]) => {
      checkPageBreak(15);
      y += 4;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(title.toUpperCase(), margin, y);
      y += 2;
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.line(margin, y, pageWidth - margin, y);
      y += 5.5;
    };

    // Draw main HEADER BANNER (Slate UI Dark Concept)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, pageWidth - 2 * margin, 26, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("FRITADEIRA DE COPIES DO INSS", margin + 6, y + 10);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(244, 63, 94); // rose-500
    doc.text("AUDITORIA SUPER ESCRUPULOSA DO CRIVO DA VERDADE", margin + 6, y + 15);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`, pageWidth - margin - 6, y + 15, { align: "right" });

    y += 33;

    // Row containing Overall Score & Verdict
    checkPageBreak(25);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(margin, y, pageWidth - 2 * margin, 20, "FD");

    // Add Overall Score text
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("SCORE GERAL DA COPY:", margin + 5, y + 7);
    
    doc.setFontSize(18);
    const scoreVal = critiqueResult.overallScore;
    if (scoreVal < 45) {
      doc.setTextColor(190, 24, 74); // rose-700
    } else if (scoreVal < 70) {
      doc.setTextColor(180, 83, 9); // amber-700
    } else {
      doc.setTextColor(4, 120, 87); // emerald-700
    }
    doc.text(`${scoreVal} / 100`, margin + 5, y + 15);

    // Add Verdict text
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("VERDITO CRÍTICO:", margin + 70, y + 7);
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(critiqueResult.overallVerdict, margin + 70, y + 14);

    y += 26;

    // Verdict explanation paragraph
    printParagraph(`"${critiqueResult.overallExplanation}"`, 9.5, "oblique", [71, 85, 105]);
    y += 3;

    // Voice analysis
    printSectionHeader("Análise de Performance Vocal & Acústica");
    printBullet("Pontuação de Comunicação Vocal", `${critiqueResult.voiceAnalysis.generalScore}/100`);
    printBullet("Feedback de Tom & Atitude", critiqueResult.voiceAnalysis.toneFeedback);
    printBullet("Feedback de Ritmo (Velocidade)", critiqueResult.voiceAnalysis.paceFeedback);

    // Narrative structure
    printSectionHeader("Estrutura Narrativa & Persuasiva");
    printBullet("Impacto do Gancho de Entrada", `${critiqueResult.narrativeStructure.hookEffectiveness.score}/100 — ${critiqueResult.narrativeStructure.hookEffectiveness.critique}`);
    printBullet("Construção de Tensão (Desejo)", `${critiqueResult.narrativeStructure.tensionBuilding.score}/100 — ${critiqueResult.narrativeStructure.tensionBuilding.critique}`);
    printBullet("Fluxo Lógico & Encadeamento", `${critiqueResult.narrativeStructure.logicalFlow.score}/100 — ${critiqueResult.narrativeStructure.logicalFlow.critique}`);
    if (critiqueResult.narrativeStructure.pacingIssues && critiqueResult.narrativeStructure.pacingIssues.length > 0) {
      printBullet("Alertas de Ritmo (Pacing)", critiqueResult.narrativeStructure.pacingIssues.join(", "));
    }

    // Objection Handling Section
    printSectionHeader("Análise Preditiva de Objeções (Segurança)");
    printBullet("Índice de Blindagem Psicológica", `${critiqueResult.objectionHandling?.objectionHandlingScore || 0}/100`);
    if (critiqueResult.objectionHandling?.anticipatedObjections && critiqueResult.objectionHandling.anticipatedObjections.length > 0) {
      printBullet("Objeções Esperadas do Aposentado", critiqueResult.objectionHandling.anticipatedObjections.join("; "));
    }
    if (critiqueResult.objectionHandling?.addressedObjections && critiqueResult.objectionHandling.addressedObjections.length > 0) {
      printBullet("Objeções Resolvidas na Copy", critiqueResult.objectionHandling.addressedObjections.join("; "));
    }
    if (critiqueResult.objectionHandling?.missingObjections && critiqueResult.objectionHandling.missingObjections.length > 0) {
      printBullet("Furos Críticos de Segurança", critiqueResult.objectionHandling.missingObjections.join("; "));
    }

    // Emotional Journey Map
    printSectionHeader("Mapeamento Emotional & Empatia");
    if (critiqueResult.emotionalJourneyMap?.intendedEmotions && critiqueResult.emotionalJourneyMap.intendedEmotions.length > 0) {
      printBullet("Sentimento Projetado pelo Vendedor", critiqueResult.emotionalJourneyMap.intendedEmotions.join(", "));
    }
    if (critiqueResult.emotionalJourneyMap?.actualEmotions && critiqueResult.emotionalJourneyMap.actualEmotions.length > 0) {
      printBullet("Reação Emocional Real do Idoso", critiqueResult.emotionalJourneyMap.actualEmotions.join(", "));
    }
    if (critiqueResult.emotionalJourneyMap?.emotionalGaps && critiqueResult.emotionalJourneyMap.emotionalGaps.length > 0) {
      printBullet("Gargalos & Desconexões", critiqueResult.emotionalJourneyMap.emotionalGaps.join("; "));
    }

    // Makeover Strategy
    printSectionHeader("Decisões Estratégicas do Makeover");
    if (critiqueResult.makeoverStrategy?.coreStrategicChanges && critiqueResult.makeoverStrategy.coreStrategicChanges.length > 0) {
      printBullet("Mudanças Estruturais Efetuadas", critiqueResult.makeoverStrategy.coreStrategicChanges.join(" / "));
    }
    if (critiqueResult.makeoverStrategy?.priorityRanking && critiqueResult.makeoverStrategy.priorityRanking.length > 0) {
      printBullet("Ordem Crítica de Correção", critiqueResult.makeoverStrategy.priorityRanking.join(" -> "));
    }

    // ROTEIRO RECOMENDADO SECTION (MAKE OVER TRANSFORMATION)
    printSectionHeader("O Roteiro Recomendado (Versão Integral de Alta Conversão)");
    
    checkPageBreak(25);
    doc.setFillColor(240, 253, 244); // green-50
    doc.setDrawColor(187, 247, 208); // green-200
    doc.rect(margin - 2, y, pageWidth - 2 * margin + 4, 10, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61); // green-700
    doc.text("ROTEIRO REESCRITO INTEGRAL PERSUASIVO", margin, y + 6.5);
    y += 14;

    const fullScript = critiqueResult.makeover.completeNewScript || "";
    printParagraph(fullScript, 9.5, "normal", [15, 23, 42]);

    // Page numbers footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
    }

    doc.save(`relatorio-auditoria-script-score-${critiqueResult.overallScore}.pdf`);
  };

  // Handle Preset Script load
  const loadPreset = (preset: typeof SCRIPTS_DEMO[0]) => {
    setTextScript(preset.text);
    setSubAudience(preset.subAudience);
    setActiveTab("text");
  };

  // Start Mic Recording
  const startRecording = async () => {
    setErrorMsg("");
    setCritiqueResult(null);
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("O navegador não suporta gravação de áudio ou falta permissão de microfone.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlobObj = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlobObj);
        setAudioUrl(URL.createObjectURL(audioBlobObj));
        // Stop all track nodes
        stream.getTracks().forEach((track) => track.stop());
      };

      setRecordingDuration(0);
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Falha ao acessar o microfone. Verifique as permissões de gravação.");
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Convert blob/file to base64
  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          // extract only raw base64 part
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Formato de arquivo inválido"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Trigger evaluation request
  const handleEvaluate = async () => {
    setErrorMsg("");
    setCritiqueResult(null);

    // Dynamic processing steps animations
    const steps = [
      "Afiando as lâminas da crítica...",
      "Destrinchando os clichês e as promessas vazias...",
      "Avaliando os gatilhos frágeis considerando o público do INSS...",
      "Expondo os furos do Call-To-Action (CTA)...",
      "Calculando a chance de sobrevivência da abordagem no mundo real...",
      "Escrevendo uma versão de elite..."
    ];

    let currentStepIdx = 0;
    setStatusStep(steps[0]);
    setIsLoading(true);

    const stepInterval = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        setStatusStep(steps[currentStepIdx]);
      }
    }, 1800);

    try {
      let payload: any = {
        type: activeTab === "text" ? "text" : "audio",
        subAudienceDetail: subAudience,
      };

      if (activeTab === "text") {
        if (!textScript.trim()) {
          throw new Error("Por favor, cole ou escreva o script de vendas no campo de texto.");
        }
        payload.textScript = textScript;
      } else if (activeTab === "record") {
        if (!audioBlob) {
          throw new Error("Nenhum áudio foi gravado. Clique no microfone para falar.");
        }
        const b64 = await fileToBase64(audioBlob);
        payload.audioBase64 = b64;
        payload.audioMimeType = "audio/webm";
      } else if (activeTab === "upload") {
        if (!uploadedFile) {
          throw new Error("Por favor, anexe uma gravação de áudio em formato MP3/WAV/WMA/M4A.");
        }
        const b64 = await fileToBase64(uploadedFile);
        payload.audioBase64 = b64;
        payload.audioMimeType = uploadedFile.type || "audio/mpeg";
      }

      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro do servidor (${response.status}) ao analisar.`);
      }

      const data: CritiqueReport = await response.json();
      setCritiqueResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro inesperado ao enviar copy para avaliação brutal.");
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
      setStatusStep("");
    }
  };

  // Helper for formatting duration
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // File drag & drop handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setUploadedFileUrl(URL.createObjectURL(file));
      setCritiqueResult(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Scoring background and text colors helper (strict scale design)
  const getScoreColor = (score: number) => {
    if (score < 40) return { bg: "bg-red-950/40", border: "border-red-500", text: "text-red-400", alertIcon: "text-red-500" };
    if (score < 70) return { bg: "bg-amber-950/40", border: "border-amber-500", text: "text-amber-400", alertIcon: "text-amber-500" };
    return { bg: "bg-emerald-950/40", border: "border-emerald-500", text: "text-emerald-400", alertIcon: "text-emerald-500" };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-orange-500 selection:text-black">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 z-10" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        
        {/* Header Block */}
        <header className="mb-10 text-center md:text-left md:flex md:items-center md:justify-between border-b border-slate-900 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-orange-400 font-mono tracking-widest uppercase mb-3">
              <ShieldAlert className="w-3.5 h-3.5" /> Foco: Aposentados & Pensionistas do INSS
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-black tracking-tight text-white focus:outline-none">
              Crítico de Copy <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-red-500">e Áudio</span>
            </h1>
            <p className="mt-2 text-slate-400 text-sm md:text-base max-w-2xl font-light">
              Mande seu roteiro ou áudio de vendas. Receba uma avaliação brutalmente sincera e honesta sobre pontos de possível melhoria na comunicação com o público INSS/SIAPE & demais consumidores de consignados.
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex gap-2 justify-center">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Modo Análise Fria
            </span>
          </div>
        </header>

        {/* Workspace Layout Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Script / Audio Source Selection (5 cols) */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* Presets Trigger Box */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="font-display font-bold text-sm text-slate-300">Presets Instantâneos para Teste:</h3>
              </div>
              <div className="space-y-2">
                {SCRIPTS_DEMO.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => loadPreset(p)}
                    className="w-full text-left text-xs bg-slate-950 hover:bg-slate-800/80 hover:border-orange-500 transition-all border border-slate-800 p-2.5 rounded-lg flex items-center justify-between group"
                    id={`preset_btn_${i}`}
                  >
                    <div className="truncate pr-3">
                      <span className="font-semibold text-orange-400 block font-mono">{p.subAudience}</span>
                      <span className="text-slate-400 truncate block">{p.title}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form Module */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
              
              {/* Tab headers */}
              <div className="flex border-b border-slate-850 bg-slate-950" id="source_tab_headers">
                <button
                  onClick={() => { setActiveTab("text"); setCritiqueResult(null); }}
                  className={`flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "text"
                      ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  id="tab_trigger_text"
                >
                  <FileText className="w-3.5 h-3.5" /> Texto do Script
                </button>
                <button
                  onClick={() => { setActiveTab("record"); setCritiqueResult(null); }}
                  className={`flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "record"
                      ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  id="tab_trigger_record"
                >
                  <Mic className="w-3.5 h-3.5" /> Gravar Voz
                </button>
                <button
                  onClick={() => { setActiveTab("upload"); setCritiqueResult(null); }}
                  className={`flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "upload"
                      ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  id="tab_trigger_upload"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Áudio
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-5 space-y-4">
                
                {/* 1. Sub-Audience Profile Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 font-mono uppercase mb-1.5">
                    Subnível da Audiência Consignado:
                  </label>
                  <select
                    value={subAudience}
                    onChange={(e) => setSubAudience(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                    id="sub_audience_select"
                  >
                    {SUB_AUDIENCE_PROFILES.map((profile) => (
                      <option key={profile.id} value={profile.id} id={`sub_audience_opt_${profile.id}`}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500 italic bg-slate-950 p-2 rounded border border-slate-900 leading-relaxed flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
                    <span>
                      {SUB_AUDIENCE_PROFILES.find((p) => p.id === subAudience)?.insight}
                    </span>
                  </p>
                </div>

                {/* Main Action Field based on Active Tab */}
                {activeTab === "text" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 font-mono uppercase">
                      Texto do Script / Pitch de Vendas:
                    </label>
                    <textarea
                      value={textScript}
                      onChange={(e) => { setTextScript(e.target.value); setCritiqueResult(null); }}
                      placeholder="Cole aqui o seu roteiro de telemarketing consignado, script de rádio de refinanciamento, ou introdução de pré-vendas..."
                      className="w-full min-h-[220px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-100 focus:outline-none focus:border-orange-500 transition-colors leading-relaxed"
                      id="text_script_input"
                    />
                  </div>
                )}

                {activeTab === "record" && (
                  <div className="space-y-4 py-3 text-center">
                    <div className="bg-slate-950 rounded-xl p-6 border border-slate-850 flex flex-col items-center justify-center space-y-4">
                      
                      {/* Circle pulse with mic */}
                      <div className="relative">
                        {isRecording && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500/30 opacity-75"></span>
                        )}
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                            isRecording
                              ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                              : "bg-slate-800 hover:bg-orange-500 hover:text-black text-orange-400"
                          }`}
                          title={isRecording ? "Parar Gravação" : "Iniciar Gravação de Voz"}
                          id="mic_record_trigger"
                        >
                          {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                      </div>

                      <div>
                        {isRecording ? (
                          <div className="space-y-1">
                            <p className="text-red-500 font-mono text-sm font-bold animate-pulse">GRAVANDO VOZ LIVE</p>
                            <p className="text-2xl font-mono font-black text-white">{formatTime(recordingDuration)}</p>
                          </div>
                        ) : audioBlob ? (
                          <div className="space-y-1">
                            <p className="text-emerald-500 font-mono text-xs font-bold">GRAVADO COM SUCESSO</p>
                            <p className="text-xs text-slate-400 font-mono">Pronto para envio implacável</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-slate-300 text-sm font-semibold">Simule seu pitch falando</p>
                            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                              Clique no botão, leia o script de vendas em voz alta e teste a honestidade da análise de IA em cima do tom e ritmo de fala. No máximo 2 minutos.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* WebM Playback if recorded */}
                      {audioUrl && !isRecording && (
                        <div className="w-full pt-2 border-t border-slate-900 space-y-2">
                          <p className="text-left text-xs font-mono text-slate-400">Escute a gravação:</p>
                          <audio src={audioUrl} controls className="w-full h-8" id="playback_recorded_audio" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "upload" && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-400 font-mono uppercase">
                      Anexar arquivo de áudio para triagem:
                    </label>
                    
                    <div className="border border-dashed border-slate-800 hover:border-orange-500 bg-slate-950 transition-colors rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 relative cursor-pointer group">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        id="audio_file_picker"
                      />
                      <FileAudio className="w-10 h-10 text-slate-500 group-hover:text-orange-400 transition-colors" />
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Derrube o arquivo de áudio aqui</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">Suporta mp3, wav, m4a, webm ou ogg</p>
                      </div>
                    </div>

                    {uploadedFile && (
                      <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-300 truncate max-w-[180px]">{uploadedFile.name}</span>
                          <span className="text-slate-500 shrink-0 font-mono">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        {uploadedFileUrl && (
                          <audio src={uploadedFileUrl} controls className="w-full h-8" id="playback_uploaded_audio" />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Submeter Evaluator Button */}
                <button
                  onClick={handleEvaluate}
                  disabled={isLoading || (activeTab === "text" && !textScript.trim()) || (activeTab === "record" && !audioBlob && !isRecording) || (activeTab === "upload" && !uploadedFile)}
                  className={`w-full py-4 px-6 rounded-lg font-display font-extrabold uppercase text-sm tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isLoading
                      ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-black font-black hover:shadow-orange-500/20 active:translate-y-px"
                  }`}
                  id="submit_evaluation_btn"
                >
                  <Sparkles className="w-4 h-4" /> Despedaçar Copy Agora!
                </button>

                {errorMsg && (
                  <div className="bg-red-950/40 border border-red-900 rounded-lg p-3 flex items-start gap-2.5" id="error_alert_block">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300 leading-relaxed">{errorMsg}</p>
                  </div>
                )}

              </div>
            </div>

            {/* Advice notice warning */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 text-[11px] text-slate-500 leading-relaxed font-mono">
              <span className="text-amber-500 font-bold">ALERTA DE USO:</span> A análise do Gemini 3.5-Flash é implacável e construída com base em heurísticas psicológicas extremas de idosos (medo de fraudes, aversão à insistência e baixa fluidez digital). Prepare-se para ver sua copy ser destruída.
            </div>

          </section>

          {/* Right Column: Scathing Report Render Screen (7 cols) */}
          <section className="lg:col-span-7">
            
            {/* Loading state placeholders */}
            {isLoading && (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-10 text-center space-y-6 shadow-2xl animate-pulse" id="loading_state_container">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="space-y-2">
                  <h3 className="font-display font-black text-xl text-white">Análise Brutal Em Processo</h3>
                  <p className="text-orange-400 font-mono text-sm uppercase tracking-wider animate-bounce">{statusStep}</p>
                </div>
                <div className="max-w-sm mx-auto bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs text-slate-500 italic">
                  &ldquo;Aposentados no Brasil sofrem dezenas de ligações de assédio diariamente. Se a sua copy parecer 'apenas mais uma', ela será deletada pelo cérebro deles em meio segundo.&rdquo;
                </div>
              </div>
            )}

            {/* Empty State when no analysis generated yet */}
            {!isLoading && !critiqueResult && (
              <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-10 text-center space-y-6 shadow-2xl flex flex-col items-center" id="empty_state_container">
                <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-2">
                  <Flame className="w-8 h-8 text-slate-500" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="font-display font-black text-lg text-white">Pronto para a Avaliação Brutal</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Escolha um de nossos <strong className="text-orange-400">presets de script de teste rápidos</strong> à esquerda ou grave a sua própria voz para começar a dissecar a qualidade real do seu pitch de INSS.
                  </p>
                </div>
                
                {/* Guidelines Checklist */}
                <div className="w-full text-left max-w-md bg-slate-950/70 p-4 rounded-xl border border-slate-900 mt-6 space-y-3">
                  <span className="text-xs font-bold text-slate-400 block font-mono">CRITÉRIOS QUE SERÃO FRITADOS:</span>
                  <div className="space-y-2">
                    <div className="flex gap-2.5 text-xs text-slate-400">
                      <span className="text-orange-500 shrink-0 font-mono">01.</span>
                      <span><strong>Uso de Gatilhos Frágeis:</strong> Falsas urgências, escassez mentirosa que causam asco imediato no aposentado.</span>
                    </div>
                    <div className="flex gap-2.5 text-xs text-slate-400">
                      <span className="text-orange-500 shrink-0 font-mono">02.</span>
                      <span><strong>CTAs Confusos/Digitais:</strong> Pistas confusas como 'clique no link', 'baixe o app', fora do hábito cognitivo do idoso.</span>
                    </div>
                    <div className="flex gap-2.5 text-xs text-slate-400">
                      <span className="text-orange-500 shrink-0 font-mono">03.</span>
                      <span><strong>Ocupação de Headspace:</strong> Jargões bancários intimidadores ou atitudes puramente gananciosas que quebram a conexão e ativam o gatilho anti-golpe.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Critique Report Section */}
            {critiqueResult && !isLoading && (
              <div className="space-y-8" id="critique_report_container">
                
                {/* PDF Report Export Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
                  <div className="space-y-1">
                    <span className="text-emerald-400 font-mono text-xs font-black tracking-widest block uppercase">⚡ AUDITORIA CONCLUÍDA</span>
                    <p className="text-xs text-slate-405 leading-relaxed text-slate-400">
                      Dissecamos o crivo de segurança, as objeções e o ritmo vocal. Baixe o relatório em PDF com o score geral e o roteiro recomendado.
                    </p>
                  </div>
                  <button
                    onClick={generatePDFReport}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black font-display text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-950/20 active:translate-y-0.5 transition-all cursor-pointer select-none shrink-0"
                    id="download_pdf_report_btn"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Relatório PDF
                  </button>
                </div>
                
                {/* 1. Score & Score Thermometer Banner */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
                  
                  {/* Harsh grader label badge */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-red-950 border border-red-800 font-mono text-[10px] text-red-400 uppercase tracking-widest rounded-md">
                    Nota Super Escrupulosa
                  </div>

                  <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
                    {/* Ring score chart */}
                    <div className="flex-shrink-0 mx-auto md:mx-0 flex flex-col items-center justify-center">
                      <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-slate-950 border-4 border-slate-800 shadow-inner">
                        {/* Fake SVG colored ring */}
                        <svg className="absolute w-28 h-28 transform -rotate-90">
                          <circle
                            cx="56"
                            cy="56"
                            r="50"
                            stroke="#0f172a"
                            strokeWidth="6"
                            fill="transparent"
                          />
                          <circle
                            cx="56"
                            cy="56"
                            r="50"
                            stroke={critiqueResult.overallScore < 45 ? "#ef4444" : critiqueResult.overallScore < 70 ? "#f59e0b" : "#10b981"}
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 50}
                            strokeDashoffset={2 * Math.PI * 50 * (1 - critiqueResult.overallScore / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="text-center z-10">
                          <span className="text-3xl font-black text-white font-mono tracking-tighter">
                            {critiqueResult.overallScore}
                          </span>
                          <span className="text-slate-500 block text-[9px] uppercase font-mono tracking-widest">Limite 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Verdict description */}
                    <div className="space-y-2 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono">Veredito Geral:</span>
                        <span className="px-3 py-0.5 rounded text-xs font-black font-mono tracking-widest bg-red-950 text-red-400 border border-red-800">
                          {critiqueResult.overallVerdict}
                        </span>
                      </div>
                      <p className="text-slate-200 text-sm italic font-light leading-relaxed">
                        &ldquo;{critiqueResult.overallExplanation}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transcription Drawer if audio analysis */}
                {critiqueResult.transcription && (
                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-lg space-y-2">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-300">
                      <Volume2 className="w-4 h-4 text-orange-400" />
                      <h4 className="font-display font-extrabold text-sm uppercase tracking-wide">Transcrição do Áudio Analisado:</h4>
                    </div>
                    <p className="text-xs font-mono text-slate-400 leading-relaxed bg-slate-950 p-3 rounded border border-slate-900 max-h-40 overflow-y-auto">
                      "{critiqueResult.transcription}"
                    </p>
                  </div>
                )}

                {/* Vocal performance and tempo analysis section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-orange-400 animate-pulse" />
                      <h3 className="font-display font-black text-lg text-white">Análise da Performance Vocal e Acústica</h3>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-orange-400 font-bold">
                      Aproveitamento Vocal: {critiqueResult.voiceAnalysis.generalScore}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="vocal_critique_cards">
                    {/* Tom de Voz Card */}
                    <div className="bg-slate-900 border border-slate-850 hover:border-orange-500/30 transition-all rounded-xl p-5 space-y-3 shadow-md">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-orange-950 text-orange-400 border border-orange-900 font-mono text-xs">
                          TOM
                        </span>
                        <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-300">Tom de Voz</h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed text-justify">
                        {critiqueResult.voiceAnalysis.toneFeedback}
                      </p>
                    </div>

                    {/* Pace/Speed Card */}
                    <div className="bg-slate-900 border border-slate-850 hover:border-amber-500/30 transition-all rounded-xl p-5 space-y-3 shadow-md">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-900 font-mono text-xs">
                          RITMO
                        </span>
                        <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-300">Ritmo e Velocidade</h4>
                      </div>
                      <p className="text-xs text-slate-405 text-slate-400 leading-relaxed text-justify">
                        {critiqueResult.voiceAnalysis.paceFeedback}
                      </p>
                    </div>

                    {/* Empatia Profissional Card */}
                    <div className="bg-slate-900 border border-slate-850 hover:border-red-500/30 transition-all rounded-xl p-5 space-y-3 shadow-md">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-red-950 text-red-400 border border-red-900 font-mono text-xs">
                          CALOR
                        </span>
                        <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-300">Calor & Empatia</h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed text-justify">
                        {critiqueResult.voiceAnalysis.warmthEvaluation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1.5. Narrative Structure (Storytelling & Persuasion Sequence) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-purple-400" />
                      <h3 className="font-display font-black text-lg text-white">Análise de Estrutura Narrativa & Storytelling</h3>
                    </div>
                    <span className="text-xs font-mono px-3 py-1 bg-purple-950/40 border border-purple-900 rounded-full text-purple-400 font-bold">
                      Fluxo de Atenção e Ordem
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-6">
                    
                    {/* Intro text explaining the sequential story */}
                    <div className="text-xs text-slate-400 leading-relaxed border-b border-slate-850 pb-4">
                      <strong className="text-purple-400">Heurística Narrativa:</strong> Uma abordagem consignada de alta performance necessita respeitar a sequência lógica da mente humana. Se você solicita uma decisão ou joga o preço antes de construir o desejo e acolher o idoso, o script quebra automaticamente por ativar os alarmes anti-golpe.
                    </div>

                    {/* Three major storytelling stages */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* Hook Step */}
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-3 hover:border-purple-900/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-slate-500 block">Fase 1: Gancho (0s - 7s)</span>
                            <h4 className="font-display font-extrabold text-xs text-slate-200">Eficácia da Abertura</h4>
                          </div>
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            critiqueResult.narrativeStructure.hookEffectiveness.score < 45 ? "bg-red-950/50 text-red-400" : critiqueResult.narrativeStructure.hookEffectiveness.score < 70 ? "bg-amber-950/50 text-amber-400" : "bg-emerald-950/50 text-emerald-400"
                          }`}>
                            {critiqueResult.narrativeStructure.hookEffectiveness.score}%
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              critiqueResult.narrativeStructure.hookEffectiveness.score < 45 ? "bg-red-500" : critiqueResult.narrativeStructure.hookEffectiveness.score < 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${critiqueResult.narrativeStructure.hookEffectiveness.score}%` }}
                          />
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed text-justify">
                          {critiqueResult.narrativeStructure.hookEffectiveness.critique}
                        </p>
                      </div>

                      {/* Desire/Tension Step */}
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-3 hover:border-purple-900/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-slate-500 block">Fase 2: Desenvolvimento</span>
                            <h4 className="font-display font-extrabold text-xs text-slate-200">Construção de Tensão</h4>
                          </div>
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            critiqueResult.narrativeStructure.tensionBuilding.score < 45 ? "bg-red-950/50 text-red-400" : critiqueResult.narrativeStructure.tensionBuilding.score < 70 ? "bg-amber-950/50 text-amber-400" : "bg-emerald-950/50 text-emerald-400"
                          }`}>
                            {critiqueResult.narrativeStructure.tensionBuilding.score}%
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              critiqueResult.narrativeStructure.tensionBuilding.score < 45 ? "bg-red-500" : critiqueResult.narrativeStructure.tensionBuilding.score < 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${critiqueResult.narrativeStructure.tensionBuilding.score}%` }}
                          />
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed text-justify">
                          {critiqueResult.narrativeStructure.tensionBuilding.critique}
                        </p>
                      </div>

                      {/* Logical Flow Step */}
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-3 hover:border-purple-900/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-slate-500 block">Fase 3: Sequência</span>
                            <h4 className="font-display font-extrabold text-xs text-slate-200">Fluxo Lógico e Ordem</h4>
                          </div>
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            critiqueResult.narrativeStructure.logicalFlow.score < 45 ? "bg-red-950/50 text-red-400" : critiqueResult.narrativeStructure.logicalFlow.score < 70 ? "bg-amber-950/50 text-amber-400" : "bg-emerald-950/50 text-emerald-400"
                          }`}>
                            {critiqueResult.narrativeStructure.logicalFlow.score}%
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              critiqueResult.narrativeStructure.logicalFlow.score < 45 ? "bg-red-500" : critiqueResult.narrativeStructure.logicalFlow.score < 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${critiqueResult.narrativeStructure.logicalFlow.score}%` }}
                          />
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed text-justify">
                          {critiqueResult.narrativeStructure.logicalFlow.critique}
                        </p>
                      </div>

                    </div>

                    {/* Pacing issues list details */}
                    {critiqueResult.narrativeStructure.pacingIssues && critiqueResult.narrativeStructure.pacingIssues.length > 0 && (
                      <div className="pt-4 border-t border-slate-850 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 font-mono uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
                          Alertas de Ritmo e Pacing (Quebras de Cadência):
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {critiqueResult.narrativeStructure.pacingIssues.map((issue, idx) => (
                            <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex items-start gap-2 text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                              <span className="leading-relaxed">{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* 1.75. Emotional Journey Map & Predictive Empathetic Gaps */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-pink-400" />
                      <h3 className="font-display font-black text-lg text-white">Mapa de Jornada Emocional Preditiva</h3>
                    </div>
                    <span className="text-xs font-mono px-3 py-1 bg-pink-950/40 border border-pink-900 rounded-full text-pink-400 font-bold">
                      Design vs. Realidade Psicológica
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-6">
                    {/* Predictive intro explaining why tracking the emotional state matters before the pitch */}
                    <div className="text-xs text-slate-400 leading-relaxed border-b border-slate-850 pb-4">
                      <strong className="text-pink-400">Análise Preditiva de Empatia:</strong> Em vez de apenas catalogar erros cometidos (reativo), mapeamos antecipadamente o atrito existencial do idoso. Abaixo, comparamos o espectro de emoções projetado pelo redator com a verdadeira resposta emocional que o script dispara por falhas de sintonia.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Intended emotions */}
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-3 hover:border-emerald-900/50 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-900 text-[10px] font-mono font-bold">
                            INTENÇÃO
                          </span>
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-300">Emoções Pretendidas (Vendedor)</h4>
                        </div>
                        <p className="text-[11px] text-slate-500">O que o script planeja ou presume projetar na cabeça do idoso:</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {critiqueResult.emotionalJourneyMap?.intendedEmotions?.map((emo, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-900/60 rounded text-slate-300 text-xs font-mono">
                              ✨ {emo}
                            </span>
                          )) || <span className="text-xs text-slate-500 font-mono">Nenhuma listada</span>}
                        </div>
                      </div>

                      {/* Actual emotions */}
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-3 hover:border-red-900/50 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-red-950 text-red-400 border border-red-900 text-[10px] font-mono font-bold">
                            REALIDADE
                          </span>
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-300">Emoções Reais (Aposentado)</h4>
                        </div>
                        <p className="text-[11px] text-slate-500">A verdadeira reação defensiva e biológica de quem teme fraudes:</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {critiqueResult.emotionalJourneyMap?.actualEmotions?.map((emo, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-red-950/40 border border-red-900/60 rounded text-slate-300 text-xs font-mono">
                              ⚠️ {emo}
                            </span>
                          )) || <span className="text-xs text-slate-500 font-mono">Nenhuma listada</span>}
                        </div>
                      </div>
                    </div>

                    {/* Emotional gaps analytical details */}
                    {critiqueResult.emotionalJourneyMap?.emotionalGaps && critiqueResult.emotionalJourneyMap.emotionalGaps.length > 0 && (
                      <div className="pt-4 border-t border-slate-850 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400 font-mono uppercase tracking-wider">
                          <ShieldAlert className="w-4 h-4 text-pink-400 shrink-0" />
                          Lacunas de Empatia & Atritos Existenciais Detectados:
                        </div>
                        <div className="space-y-2 text-xs">
                          {critiqueResult.emotionalJourneyMap.emotionalGaps.map((gap, idx) => (
                            <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex items-start gap-3 text-slate-300">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-950/80 border border-pink-900 text-[10px] text-pink-400 font-bold shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed text-justify">{gap}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* 2. Critical Block 1: Fragile Triggers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h3 className="font-display font-black text-lg text-white">1. Análise de Gatilhos & Densidade Persuasiva</h3>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
                      Poder de Persuasão: {critiqueResult.triggersCritique.score}/100
                    </span>
                  </div>

                  {/* Trigger Density Card */}
                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-300">Saturação & Densidade de Gatilhos</h4>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        critiqueResult.triggersCritique.triggerDensityScore > 80 ? "bg-red-950/50 text-red-400" : critiqueResult.triggersCritique.triggerDensityScore < 40 ? "bg-slate-800 text-slate-400" : "bg-emerald-950/50 text-emerald-400"
                      }`}>
                        Densidade: {critiqueResult.triggersCritique.triggerDensityScore}/100
                      </span>
                    </div>
                    
                    {/* Meter bar */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          critiqueResult.triggersCritique.triggerDensityScore > 80 ? "bg-red-500" : critiqueResult.triggersCritique.triggerDensityScore < 40 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${critiqueResult.triggersCritique.triggerDensityScore}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {critiqueResult.triggersCritique.triggerDensityExplanation}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4" id="triggers_critique_list">
                    {critiqueResult.triggersCritique.points.map((pt, i) => {
                      // Map trigger types to styling and icon strings
                      let typeLabel = "Ausente / Recomendado";
                      let typeColor = "bg-purple-950 text-purple-400 border-purple-900";
                      
                      if (pt.triggerType === "weak") {
                        typeLabel = "Frágil / Superficial";
                        typeColor = "bg-amber-950 text-amber-400 border-amber-900";
                      } else if (pt.triggerType === "misapplied") {
                        typeLabel = "Mal Aplicado / Agressivo";
                        typeColor = "bg-red-950 text-red-400 border-red-900";
                      } else if (pt.triggerType === "overused") {
                        typeLabel = "Saturado / Excesso";
                        typeColor = "bg-orange-950 text-orange-400 border-orange-900";
                      } else if (pt.triggerType === "absent") {
                        typeLabel = "Ausente / Recomendado";
                        typeColor = "bg-slate-950 text-slate-400 border-slate-800";
                      }

                      return (
                        <div key={i} className="bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl p-5 transition-all space-y-4 shadow-md">
                          
                          {/* Header line for point */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                              <span className="text-xs font-mono text-slate-400">Gatilho analisado:</span>
                              <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-200 font-mono text-[10px] font-bold uppercase tracking-wider border border-slate-800">
                                {pt.triggerName}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider border ${typeColor}`}>
                              {typeLabel}
                            </span>
                          </div>

                          {/* Speech excerpt quotation */}
                          {pt.originalQuote && pt.originalQuote !== "N/A" && pt.originalQuote !== "" && (
                            <div className="bg-slate-950 border border-slate-900 pl-3.5 py-2.5 pr-2 rounded-r-lg border-l-2 border-red-500 italic text-xs font-mono text-slate-300 leading-relaxed">
                              &ldquo;{pt.originalQuote}&rdquo;
                            </div>
                          )}

                          {/* Critical analysis panel & solution layout */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                            {/* Critique detail */}
                            <div className="bg-slate-950/40 border border-slate-900 rounded p-3 space-y-1.5">
                              <span className="font-bold text-red-500 uppercase font-mono block text-[10px] tracking-wider">Por que falha na mente do Idoso?</span>
                              <p className="text-slate-400 leading-relaxed">{pt.critique}</p>
                            </div>
                            {/* Re-design solution detail */}
                            <div className="bg-slate-950/40 border border-slate-900 rounded p-3 space-y-1.5">
                              <span className="font-bold text-emerald-500 uppercase font-mono block text-[10px] tracking-wider font-bold">Como reformular com integridade?</span>
                              <p className="text-slate-400 leading-relaxed">{pt.solution}</p>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Critical Block 2: Call To Action Weaknesses */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    <h3 className="font-display font-black text-lg text-white">2. Fragilidade da Chamada para Ação (CTA)</h3>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{critiqueResult.ctaCritique.title}</span>
                      <span className="text-xs font-mono px-2 py-0.5 bg-slate-950 border border-slate-850 text-amber-400 rounded">
                        Grau de Comando: {critiqueResult.ctaCritique.score}/100
                      </span>
                    </div>

                    <div className="bg-slate-950 border border-slate-900 pl-3.5 py-2.5 pr-2 rounded-r-lg border-l-2 border-amber-500 italic text-xs font-mono text-slate-300 leading-relaxed">
                      &ldquo;{critiqueResult.ctaCritique.originalQuote}&rdquo;
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pb-4 border-b border-slate-850">
                      {/* Critique detail */}
                      <div className="space-y-1.5">
                        <span className="font-bold text-red-400 uppercase font-mono block text-[10px] tracking-wider">O Ponto Cego Psicológico:</span>
                        <p className="text-slate-400 leading-relaxed text-justify">{critiqueResult.ctaCritique.critique}</p>
                      </div>
                      {/* Re-design solution detail */}
                      <div className="space-y-1.5 ">
                        <span className="font-bold text-emerald-400 uppercase font-mono block text-[10px] tracking-wider font-bold">A Solução Consertada:</span>
                        <p className="text-slate-400 leading-relaxed text-justify">{critiqueResult.ctaCritique.solution}</p>
                      </div>
                    </div>

                    {/* Dynamic CTA Context Analysis panel */}
                    <div className="space-y-4 pt-2" id="cta_context_analysis">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                          <Info className="w-4 h-4 text-amber-500 shrink-0" />
                          Saúde do Contexto & Maturidade da Abordagem
                        </div>
                        {critiqueResult.ctaContextAnalysis.isPremature ? (
                          <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 bg-red-950/80 text-red-400 border border-red-900 rounded-full font-bold animate-pulse">
                            ⚠️ Chamada Prematura / Precoce
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-900 rounded-full font-bold">
                            ✅ Timing Perfeito / Maduro
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Desire Bar */}
                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-900 space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                            <span>Valor & Desejo Construídos Antes do CTA:</span>
                            <span className="font-bold text-emerald-400">{critiqueResult.ctaContextAnalysis.desireBuiltBeforeCTA}/100</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                              style={{ width: `${critiqueResult.ctaContextAnalysis.desireBuiltBeforeCTA}%` }}
                            />
                          </div>
                        </div>

                        {/* Objections Bar */}
                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-900 space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                            <span>Tratamento Prévio de Objeções complexas:</span>
                            <span className="font-bold text-amber-400">{critiqueResult.ctaContextAnalysis.objectionHandlingBeforeCTA}/100</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-amber-500 transition-all duration-500" 
                              style={{ width: `${critiqueResult.ctaContextAnalysis.objectionHandlingBeforeCTA}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Discursive coherence analysis text */}
                      <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-900 text-xs">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Coerência do Pitch de Encerramento:</span>
                        <p className="text-slate-400 leading-relaxed text-justify">
                          {critiqueResult.ctaContextAnalysis.contextualCoherence}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Critical Block 3: Loss of Room/Connections in retiree headspace */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-400" />
                    <h3 className="font-display font-black text-lg text-white">3. Pontos de Quebra e Rejeição Mental (Headspace)</h3>
                  </div>

                  <div className="space-y-4" id="headspace_breaks_list">
                    {critiqueResult.headspaceBreaks.map((hb, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl p-5 shadow-sm transition-all space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-extrabold text-sm text-slate-200 uppercase tracking-wide">{hb.title}</h4>
                          <span className="text-[10px] bg-red-950 text-red-500 font-mono px-2 py-0.5 rounded border border-red-900">Perda de Espaço</span>
                        </div>

                        {/* Bad line that triggers defensive state */}
                        <div className="bg-slate-950 border border-slate-900 pl-3 py-2 text-xs font-mono text-red-400 leading-relaxed rounded border-l-2 border-red-500/30">
                          - &ldquo;{hb.originalQuote}&rdquo;
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1 bg-slate-950/20 p-3 rounded">
                            <span className="font-bold text-purple-400 uppercase font-mono block text-[9px] tracking-wider">Por que destrói a confiança?</span>
                            <p className="text-slate-400 leading-relaxed text-justify">{hb.whyItBreaks}</p>
                          </div>
                          
                          <div className="space-y-1 bg-slate-950/20 p-3 rounded border border-slate-900">
                            <span className="font-bold text-amber-500 uppercase font-mono block text-[9px] tracking-wider">Reação Interna Defensiva doIdoso:</span>
                            <p className="text-slate-400 leading-relaxed italic text-justify">
                              &ldquo;{hb.retireeReaction}&rdquo;
                            </p>
                          </div>
                        </div>

                        {/* Dynamic remediation row */}
                        <div className="pt-2 border-t border-slate-850 flex items-center gap-2 text-xs text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                          <span className="font-semibold text-slate-300">Correção de Elite:</span>
                          <span className="text-emerald-400 italic bg-slate-950 px-2 py-1.5 rounded w-full font-mono font-medium leading-relaxed">
                            {hb.solution}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Objection Handling & Psychological Safety */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-display font-black text-lg text-white">4. Gestão Preditiva de Objeções</h3>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
                      Blindagem de Objeções: {critiqueResult.objectionHandling?.objectionHandlingScore || 0}/100
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-6">
                    {/* Intro text explaining Objection Handling role */}
                    <div className="text-xs text-slate-400 leading-relaxed border-b border-slate-850 pb-4">
                      <strong className="text-emerald-400">Prevenção Psicológica de Defesas:</strong> Aposentados e pensionistas do INSS carregam resistências naturais decorrentes de traumas financeiros anteriores e medos biológicos de golpes eletrônicos. Avaliar como o texto desativa preventivamente essas barreiras de segurança é o limiar entre o fechamento e o telefone desligado na cara.
                    </div>

                    {/* Score Bar with custom message */}
                    <div className="bg-slate-950 rounded-xl p-5 border border-slate-850 space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HeartHandshake className="w-4 h-4 text-emerald-500" />
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-300 font-mono">Índice Geral de Segurança da Abordagem</h4>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          (critiqueResult.objectionHandling?.objectionHandlingScore || 0) > 75 ? "bg-emerald-950/50 text-emerald-400" : (critiqueResult.objectionHandling?.objectionHandlingScore || 0) < 40 ? "bg-red-950/50 text-red-400" : "bg-amber-950/50 text-amber-400"
                        }`}>
                          Score: {critiqueResult.objectionHandling?.objectionHandlingScore || 0}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            (critiqueResult.objectionHandling?.objectionHandlingScore || 0) > 75 ? "bg-emerald-500" : (critiqueResult.objectionHandling?.objectionHandlingScore || 0) < 40 ? "bg-red-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${critiqueResult.objectionHandling?.objectionHandlingScore || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Objection lists GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* Anticipated Objections */}
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 flex flex-col justify-between space-y-3 min-h-[180px] hover:border-slate-800 transition-all">
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-1.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-mono font-bold tracking-wider uppercase">
                              PREDICTIVE
                            </span>
                            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-200">Objeções Inevitáveis</h4>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Medos biológicos e dúvidas lógicas que a oferta desperta naturalmente na cabeça do idoso:
                          </p>
                          <ul className="space-y-2 pt-1 text-xs">
                            {critiqueResult.objectionHandling?.anticipatedObjections?.map((obj, idx) => (
                              <li key={idx} className="flex gap-2 text-slate-300">
                                <span className="text-slate-500 shrink-0 select-none">•</span>
                                <span className="leading-relaxed">{obj}</span>
                              </li>
                            )) || <li className="text-slate-500 font-mono text-[11px]">Nenhuma identificada.</li>}
                          </ul>
                        </div>
                      </div>

                      {/* Addressed Objections */}
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 flex flex-col justify-between space-y-3 min-h-[180px] hover:border-emerald-900/45 transition-all">
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 text-[9px] font-mono font-bold tracking-wider uppercase">
                              CONTORNADAS
                            </span>
                            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-200">Barreiras de fato Tratadas</h4>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            O que o roteiro/operador abordou explicitamente para acalmar o aposentado:
                          </p>
                          <ul className="space-y-2 pt-1 text-xs">
                            {critiqueResult.objectionHandling?.addressedObjections && critiqueResult.objectionHandling.addressedObjections.length > 0 ? (
                              critiqueResult.objectionHandling.addressedObjections.map((obj, idx) => (
                                <li key={idx} className="flex gap-2 text-emerald-400">
                                  <span className="text-emerald-500 shrink-0 select-none">✓</span>
                                  <span className="leading-relaxed text-slate-300">{obj}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-slate-500 font-mono text-[11px] bg-slate-900 p-2.5 rounded border border-slate-850 italic text-justify leading-relaxed">
                                Nenhuma objeção foi desarmada de forma madura. O vendedor ignorou os anseios do aposentado.
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Missing Objections */}
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 flex flex-col justify-between space-y-3 min-h-[180px] hover:border-red-900/45 transition-all">
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-1.5 rounded bg-red-950 text-red-400 border border-red-900 text-[9px] font-mono font-bold tracking-wider uppercase">
                              CRÍTICAS / FUROS
                            </span>
                            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-200">Objeções Cruciais Ignoradas</h4>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Anseios urgentes que ficaram totalmente sem resposta, gerando paralisia comercial:
                          </p>
                          <ul className="space-y-2 pt-1 text-xs">
                            {critiqueResult.objectionHandling?.missingObjections && critiqueResult.objectionHandling.missingObjections.length > 0 ? (
                              critiqueResult.objectionHandling.missingObjections.map((obj, idx) => (
                                <li key={idx} className="flex gap-2 text-red-400">
                                  <span className="text-red-500 shrink-0 select-none">✗</span>
                                  <span className="leading-relaxed text-slate-300">{obj}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-emerald-500 font-mono text-[11px] bg-slate-900 p-2 text-center rounded border border-slate-850">
                                Nenhuma lacuna alarmante de objeção encontrada!
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* 5. Clean Side-by-Side Makeover Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-6">
                  
                  {/* Banner bar */}
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-600/20 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-400" />
                      <h3 className="font-display font-black text-base text-white tracking-wide uppercase">O Camarim de Transformação (Makeover)</h3>
                    </div>
                    <span className="text-xs font-mono text-orange-400 bg-slate-950 px-2 h-6 flex items-center rounded border border-orange-500/30">Antes vs Depois</span>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Visual Comparison Elements */}
                    <div className="space-y-4">
                      
                      {/* Hook block */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-500"></span> O Gancho (Hook):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950 border border-slate-850 p-3.5 rounded text-xs text-red-400 italic leading-relaxed">
                            <strong>Original:</strong> &ldquo;{critiqueResult.makeover.hook.original}&rdquo;
                          </div>
                          <div className="bg-slate-950 border border-emerald-900 p-3.5 rounded text-xs text-emerald-400 font-medium leading-relaxed">
                            <strong>Correto:</strong> &ldquo;{critiqueResult.makeover.hook.replacement}&rdquo;
                            <span className="block mt-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500 leading-normal font-mono">
                              Motivo: {critiqueResult.makeover.hook.why}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Body block */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-500"></span> O Desenvolvimento (Body):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950 border border-slate-850 p-3.5 rounded text-xs text-red-400 italic leading-relaxed">
                            <strong>Original:</strong> &ldquo;{critiqueResult.makeover.body.original}&rdquo;
                          </div>
                          <div className="bg-slate-950 border border-emerald-900 p-3.5 rounded text-xs text-emerald-400 font-medium leading-relaxed">
                            <strong>Correto:</strong> &ldquo;{critiqueResult.makeover.body.replacement}&rdquo;
                            <span className="block mt-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500 leading-normal font-mono">
                              Motivo: {critiqueResult.makeover.body.why}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CTA Block */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-500"></span> Chamada de Ação (CTA):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950 border border-slate-850 p-3.5 rounded text-xs text-red-400 italic leading-relaxed">
                            <strong>Original:</strong> &ldquo;{critiqueResult.makeover.cta.original}&rdquo;
                          </div>
                          <div className="bg-slate-950 border border-emerald-900 p-3.5 rounded text-xs text-emerald-400 font-medium leading-relaxed">
                            <strong>Correto:</strong> &ldquo;{critiqueResult.makeover.cta.replacement}&rdquo;
                            <span className="block mt-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500 leading-normal font-mono">
                              Motivo: {critiqueResult.makeover.cta.why}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* 5.5. Strategic Roadmap (makeoverStrategy) */}
                    {critiqueResult.makeoverStrategy && (
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <h4 className="font-display font-black text-sm text-slate-200 tracking-wide uppercase">
                              Plano Estratégico & Justificativas Psicológicas
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono px-3 py-1 bg-indigo-950/40 border border-indigo-900/60 rounded text-indigo-300 font-bold">
                            Engenharia de Conversão
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                          {/* Col 1: Core Strategic Changes */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-1.5 font-bold text-indigo-405 font-mono uppercase tracking-wider text-indigo-400">
                              <span className="text-[11px]">🎯</span> Mudanças Críticas & Princípios Ativados:
                            </div>
                            <div className="space-y-2">
                              {critiqueResult.makeoverStrategy.coreStrategicChanges?.map((change, idx) => (
                                <div key={idx} className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg flex items-start gap-2.5">
                                  <span className="text-indigo-450 font-bold text-xs mt-0.5 shrink-0 select-none text-indigo-400">✦</span>
                                  <span className="text-slate-300 leading-relaxed text-justify">{change}</span>
                                </div>
                              )) || <span className="text-slate-500 font-mono">Nenhuma listada.</span>}
                            </div>
                          </div>

                          {/* Col 2: Optional Improvements */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-1.5 font-bold text-teal-405 font-mono uppercase tracking-wider text-teal-400">
                              <span className="text-[11px]">💡</span> Otimizações Adicionais (Nice-To-Have):
                            </div>
                            <div className="space-y-2">
                              {critiqueResult.makeoverStrategy.optionalImprovements?.map((imp, idx) => (
                                <div key={idx} className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg flex items-start gap-2.5">
                                  <span className="text-teal-450 font-bold text-xs mt-0.5 shrink-0 select-none text-teal-400">◇</span>
                                  <span className="text-slate-300 leading-relaxed text-justify">{imp}</span>
                                </div>
                              )) || <span className="text-slate-500 font-mono">Nenhuma listada.</span>}
                            </div>
                          </div>
                        </div>

                        {/* Priority Ranking Roadmap */}
                        {critiqueResult.makeoverStrategy.priorityRanking && critiqueResult.makeoverStrategy.priorityRanking.length > 0 && (
                          <div className="pt-4 border-t border-slate-900 space-y-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
                              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                              Sequência Recomendada de Implementação (Mapa de Prioridades):
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {critiqueResult.makeoverStrategy.priorityRanking.map((prio, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-850 relative group hover:border-slate-800 transition-all">
                                  <div className="absolute top-2.5 right-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-900 text-[10px] text-indigo-400 font-black font-mono shadow-md">
                                    #{idx + 1}
                                  </div>
                                  <div className="text-[10px] text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1.5">
                                    PASSO {idx + 1}
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed text-justify pr-2">
                                    {prio}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Complete Supreme Script rewrite */}
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                          <h4 className="font-display font-black text-sm text-slate-200 tracking-wide uppercase">Roteiro Recomendado Completo</h4>
                        </div>
                        <button
                          onClick={() => copyToClipboard(critiqueResult.makeover.completeNewScript)}
                          className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300 font-mono flex items-center gap-1.5 transition-all"
                          id="copy_new_script_btn"
                        >
                          {copiedScript ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copiar Texto
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-950 p-4 rounded text-xs md:text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-line border border-slate-900 shadow-inner select-all">
                        {critiqueResult.makeover.completeNewScript}
                      </div>
                      
                      <p className="text-[10px] text-slate-500 leading-normal font-mono pt-1">
                        * Dica de gravação: Leia este novo roteiro com ritmo pausado, tom de voz acolhedor, pronunciando cada palavra com calma. O idoso do INSS odeia o tom acelerado clássico do telemarketing paulista que soa automatizado ou suspeito.
                      </p>
                    </div>

                  </div>
                </div>

                {/* Reset Call operation button */}
                <div className="text-center">
                  <button
                    onClick={() => { setCritiqueResult(null); setUploadedFile(null); setAudioUrl(null); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 hover:border-slate-700 transition-colors border border-slate-800 text-xs text-slate-400 font-mono uppercase tracking-widest"
                    id="analyze_another_btn"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Avaliar Outra Cópia de Vendas
                  </button>
                </div>

              </div>
            )}

          </section>

        </div>

        {/* Footer Area */}
        <footer className="mt-16 pt-8 border-t border-slate-900 text-center text-xs text-slate-500 font-mono space-y-2">
          <p>© 2026 Crítico de Copy e Áudio. Projetado com rigor analítico absoluto.</p>
          <p>Métricas calibradas para o mercado financeiro e de crédito consignado brasileiro.</p>
        </footer>

      </div>
    </div>
  );
}
