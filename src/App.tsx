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
  ChevronRight
} from "lucide-react";
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

                {/* 2. Critical Block 1: Fragile Triggers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h3 className="font-display font-black text-lg text-white">1. Fragilidades de Gatilho Detectadas</h3>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
                      Poder de Persuasão: {critiqueResult.triggersCritique.score}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4" id="triggers_critique_list">
                    {critiqueResult.triggersCritique.points.map((pt, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl p-5 transition-all space-y-4 shadow-md">
                        
                        {/* Header line for point */}
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                          <span className="text-xs font-mono text-slate-400">Uso frágil do gatilho de:</span>
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-red-900">
                            {pt.triggerName}
                          </span>
                        </div>

                        {/* Speech excerpt quotation */}
                        <div className="bg-slate-950 border border-slate-900 pl-3.5 py-2.5 pr-2 rounded-r-lg border-l-2 border-red-500 italic text-xs font-mono text-slate-300 leading-relaxed">
                          &ldquo;{pt.originalQuote}&rdquo;
                        </div>

                        {/* Critical analysis panel & solution layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                          {/* Critique detail */}
                          <div className="bg-slate-950/40 border border-slate-900 rounded p-3 space-y-1.5">
                            <span className="font-bold text-red-500 uppercase font-mono block text-[10px] tracking-wider">Por que falha na mente do Idoso?</span>
                            <p className="text-slate-400 leading-relaxed">{pt.critique}</p>
                          </div>
                          {/* Re-design solution detail */}
                          <div className="bg-slate-950/40 border border-slate-900 rounded p-3 space-y-1.5">
                            <span className="font-bold text-emerald-500 uppercase font-mono block text-[10px] tracking-wider">Como reformular com integridade?</span>
                            <p className="text-slate-400 leading-relaxed">{pt.solution}</p>
                          </div>
                        </div>

                      </div>
                    ))}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Critique detail */}
                      <div className="space-y-1.5">
                        <span className="font-bold text-red-400 uppercase font-mono block text-[10px] tracking-wider">O Ponto Cego Psicológico:</span>
                        <p className="text-slate-400 leading-relaxed text-justify">{critiqueResult.ctaCritique.critique}</p>
                      </div>
                      {/* Re-design solution detail */}
                      <div className="space-y-1.5 ">
                        <span className="font-bold text-emerald-400 uppercase font-mono block text-[10px] tracking-wider">A Solução Consertada:</span>
                        <p className="text-slate-400 leading-relaxed text-justify">{critiqueResult.ctaCritique.solution}</p>
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
