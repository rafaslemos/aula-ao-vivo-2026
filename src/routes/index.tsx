import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Flame, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { submitSurveyResponse, type SurveyResponseInput } from "@/server/survey.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pesquisa CHora API" },
      {
        name: "description",
        content: "Pesquisa de satisfação para alunos CHora API com NPS, CES e CSAT.",
      },
      { property: "og:title", content: "Pesquisa CHora API" },
      {
        property: "og:description",
        content: "Compartilhe sua evolução no curso CHora API em menos de um minuto.",
      },
    ],
  }),
  component: Index,
});

const csatOptions = [
  { value: "muito-ruim", label: "Muito ruim", icon: "😣" },
  { value: "ruim", label: "Ruim", icon: "😕" },
  { value: "ok", label: "Ok", icon: "🙂" },
  { value: "bom", label: "Bom", icon: "😄" },
  { value: "excelente", label: "Excelente", icon: "🔥" },
] as const;

const initialForm: SurveyResponseInput = {
  studentName: "",
  studentEmail: "",
  courseDays: 45,
  nps: 9,
  ces: 6,
  csat: "bom",
  improvement: "",
};

function Index() {
  const submitSurvey = useServerFn(submitSurveyResponse);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SurveyResponseInput>(initialForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const progress = useMemo(() => Math.round(((step + 1) / 5) * 100), [step]);
  const canContinue =
    step === 0
      ? form.studentName.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.studentEmail)
      : step === 4
        ? form.improvement.trim().length >= 8
        : true;

  const update = <K extends keyof SurveyResponseInput>(key: K, value: SurveyResponseInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleNext = async () => {
    if (!canContinue || status === "loading") return;
    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }

    setStatus("loading");
    setFeedback("");
    try {
      const result = await submitSurvey({ data: form });
      setFeedback(result.message);
      setStatus("success");
    } catch {
      setFeedback("Não foi possível enviar agora. Revise os campos e tente novamente.");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background bg-hero-grid text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="survey-orbit absolute right-6 top-28 h-40 w-40 rounded-full border border-primary/30" />
        <div className="survey-orbit absolute bottom-16 left-[-3rem] h-32 w-32 rounded-full border border-verified/25" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-primary/40 bg-primary text-primary-foreground shadow-glow">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black leading-none tracking-wide">
                CHORA <span className="text-primary">API</span>
              </p>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Pesquisa 60 dias
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-bold text-muted-foreground sm:flex">
            <LockKeyhole className="h-3.5 w-3.5 text-primary" />
            Dados seguros
          </div>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-10">
          <aside className="survey-enter hidden lg:block">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-surface px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-4 w-4" /> Resultado provado
            </div>
            <h1 className="max-w-lg text-5xl font-black leading-[0.95] tracking-normal text-foreground xl:text-6xl">
              Sua evolução no <span className="text-primary">CHora API</span> em 60 segundos.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">
              Ajude a ajustar suporte, prática local e experiência do curso para quem está saindo do
              operacional.
            </p>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              {["NPS", "CES", "CSAT"].map((metric) => (
                <div
                  key={metric}
                  className="rounded-lg border border-border bg-panel-gradient p-4 text-center shadow-panel"
                >
                  <p className="text-2xl font-black text-primary">{metric}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">métrica chave</p>
                </div>
              ))}
            </div>
          </aside>

          <div className="survey-enter mx-auto w-full max-w-xl">
            <div className="mb-4 flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              <span>Etapa {step + 1}/5</span>
              <span>{progress}%</span>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-cta-gradient transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="rounded-xl border border-border bg-card/90 p-5 shadow-panel backdrop-blur md:p-7">
              {status === "success" ? (
                <SuccessPanel feedback={feedback} />
              ) : (
                <>
                  <SurveyStep step={step} form={form} update={update} />
                  {status === "error" ? (
                    <p className="mt-4 text-sm font-semibold text-destructive">{feedback}</p>
                  ) : null}
                  <div className="mt-7 flex items-center justify-between gap-3">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setStep((current) => Math.max(0, current - 1))}
                      disabled={step === 0 || status === "loading"}
                    >
                      Voltar
                    </Button>
                    <Button
                      variant="hero"
                      size="xl"
                      type="button"
                      onClick={handleNext}
                      disabled={!canContinue || status === "loading"}
                    >
                      {status === "loading" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : step === 4 ? (
                        "Enviar"
                      ) : (
                        "Continuar"
                      )}
                      {status !== "loading" ? <ArrowRight className="h-5 w-5" /> : null}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SurveyStep({
  step,
  form,
  update,
}: {
  step: number;
  form: SurveyResponseInput;
  update: <K extends keyof SurveyResponseInput>(key: K, value: SurveyResponseInput[K]) => void;
}) {
  if (step === 0) {
    return (
      <div>
        <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-primary">
          Antes de começar
        </p>
        <h2 className="text-3xl font-black tracking-normal">Quem está respondendo?</h2>
        <div className="mt-6 grid gap-4">
          <input
            className="h-13 rounded-lg border border-input bg-surface px-4 text-base font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
            placeholder="Seu nome"
            value={form.studentName}
            onChange={(event) => update("studentName", event.target.value)}
          />
          <input
            className="h-13 rounded-lg border border-input bg-surface px-4 text-base font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
            placeholder="Seu e-mail"
            type="email"
            value={form.studentEmail}
            onChange={(event) => update("studentEmail", event.target.value)}
          />
          <label className="text-sm font-bold text-muted-foreground">
            Dias de curso: <span className="text-primary">{form.courseDays}</span>
          </label>
          <input
            className="accent-primary"
            type="range"
            min="0"
            max="60"
            value={form.courseDays}
            onChange={(event) => update("courseDays", Number(event.target.value))}
          />
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <ScoreQuestion
        eyebrow="NPS"
        title="Em uma escala de 0 a 10, quanto você recomendaria o CHora API para um amigo desenvolvedor?"
        min={0}
        max={10}
        value={form.nps}
        onChange={(value) => update("nps", value)}
      />
    );
  }

  if (step === 2) {
    return (
      <ScoreQuestion
        eyebrow="CES"
        title="Foi fácil aplicar o conhecimento da primeira API no meu ambiente local."
        min={1}
        max={7}
        value={form.ces}
        onChange={(value) => update("ces", value)}
      />
    );
  }

  if (step === 3) {
    return (
      <div>
        <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-primary">CSAT</p>
        <h2 className="text-3xl font-black tracking-normal">
          Como você avalia o suporte técnico do curso até agora?
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          {csatOptions.map((option) => (
            <Button
              key={option.value}
              variant="answer"
              size="lg"
              data-selected={form.csat === option.value}
              onClick={() => update("csat", option.value)}
              className="h-auto min-h-20 flex-col whitespace-normal px-2 py-4"
            >
              <span className="text-2xl">{option.icon}</span>
              <span>{option.label}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-primary">Aberta</p>
      <h2 className="text-3xl font-black tracking-normal">
        O que falta para o curso ser nota 10 para você?
      </h2>
      <textarea
        className="mt-6 min-h-36 w-full resize-none rounded-lg border border-input bg-surface p-4 text-base font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
        maxLength={700}
        placeholder="Conte com detalhes: aula, suporte, prática, material ou desafio local..."
        value={form.improvement}
        onChange={(event) => update("improvement", event.target.value)}
      />
      <p className="mt-2 text-right text-xs font-bold text-muted-foreground">
        {form.improvement.length}/700
      </p>
    </div>
  );
}

function ScoreQuestion({
  eyebrow,
  title,
  min,
  max,
  value,
  onChange,
}: {
  eyebrow: string;
  title: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="text-2xl font-black leading-tight tracking-normal sm:text-3xl">{title}</h2>
      <div className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-11">
        {Array.from({ length: max - min + 1 }, (_, index) => index + min).map((score) => (
          <Button
            key={score}
            variant="answer"
            size="score"
            data-selected={value === score}
            onClick={() => onChange(score)}
            aria-pressed={value === score}
          >
            {score}
          </Button>
        ))}
      </div>
      <div className="mt-4 flex justify-between text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function SuccessPanel({ feedback }: { feedback: string }) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verified text-primary-foreground shadow-glow">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <h2 className="mt-5 text-3xl font-black tracking-normal">Resposta enviada!</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{feedback}</p>
    </div>
  );
}
