import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, Share, Plus, CheckCircle2, RefreshCw } from "lucide-react";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

export default function InstalarApp() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setInstalled(isStandalone);

    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  return (
    <AppLayout title="Instalar Aplicativo" subtitle="Use o VEGA como app no seu celular">
      <div className="max-w-2xl space-y-5">
        {installed && (
          <Card className="border-success/40 bg-success/5">
            <CardContent className="p-5 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div>
                <p className="text-sm font-semibold">App instalado!</p>
                <p className="text-xs text-muted-foreground">Você já está usando o VEGA como aplicativo.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hero */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-gold/5">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display font-bold text-lg">VEGA Dental no seu celular</h2>
              <p className="text-sm text-muted-foreground">
                Instale como aplicativo para acesso rápido pelo ícone na tela inicial. Funciona offline em telas já visitadas e atualiza automaticamente sempre que houver uma nova versão.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plataforma seletor */}
        <div className="flex gap-2">
          {([["android", "Android"], ["ios", "iPhone / iPad"], ["desktop", "Computador"]] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setPlatform(v as Platform)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                platform === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Instruções por plataforma */}
        {platform === "android" && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> Instalar no Android
              </h3>
              {installPrompt ? (
                <Button onClick={handleInstall} className="w-full gap-2 h-11">
                  <Download className="h-4 w-4" /> Instalar Aplicativo
                </Button>
              ) : (
                <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
                  <li>Abra o VEGA pelo <strong>Chrome</strong> no seu celular Android.</li>
                  <li>Toque no menu (⋮) no canto superior direito.</li>
                  <li>Selecione <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  <li>Confirme a instalação. O ícone do VEGA aparecerá na sua tela.</li>
                </ol>
              )}
            </CardContent>
          </Card>
        )}

        {platform === "ios" && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Share className="h-4 w-4 text-primary" /> Instalar no iPhone / iPad
              </h3>
              <p className="text-xs text-muted-foreground">
                No iOS, é necessário usar o navegador <strong>Safari</strong> e adicionar o app manualmente.
              </p>
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
                <li>Abra o VEGA pelo navegador <strong>Safari</strong>.</li>
                <li>
                  Toque no botão <Share className="inline h-3.5 w-3.5 mx-1" /> <strong>Compartilhar</strong> (na barra inferior).
                </li>
                <li>
                  Role para baixo e toque em <Plus className="inline h-3.5 w-3.5 mx-1" /> <strong>"Adicionar à Tela de Início"</strong>.
                </li>
                <li>Confirme em <strong>"Adicionar"</strong> no canto superior direito.</li>
                <li>Pronto! O VEGA estará na sua tela inicial como um aplicativo.</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {platform === "desktop" && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> Instalar no Computador
              </h3>
              {installPrompt ? (
                <Button onClick={handleInstall} className="w-full gap-2 h-11">
                  <Download className="h-4 w-4" /> Instalar Aplicativo
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No Chrome ou Edge, procure pelo ícone <Download className="inline h-3.5 w-3.5 mx-1" /> na barra de endereço para instalar o VEGA como app de desktop.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Atualização automática */}
        <Card>
          <CardContent className="p-5 flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Atualização automática</p>
              <p className="text-xs text-muted-foreground mt-1">
                O VEGA sempre carrega a última versão automaticamente sempre que você abre o app — sem precisar baixar nada de loja.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
