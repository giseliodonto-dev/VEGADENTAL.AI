import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ImagePlus,
  Loader2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

const BUCKET = "patient-exams";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ACCEPTED_ATTR = ".jpg,.jpeg,.png,.webp";

const FILE_TYPES = [
  "RX Panorâmico",
  "RX Periapical",
  "Foto Intraoral",
  "Foto Rosto",
  "Outro",
] as const;

type Exam = {
  id: string;
  clinic_id: string;
  patient_id: string;
  file_path: string;
  file_type: string;
  notes: string | null;
  created_at: string;
};

type ExamWithUrl = Exam & { url: string };

interface Props {
  patientId: string;
  clinicId: string | null;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

export function PatientExamsPanel({ patientId, clinicId }: Props) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState<string>("RX Panorâmico");
  const [notes, setNotes] = useState("");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ExamWithUrl | null>(null);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["patient_exams", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_exams")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Exam[];
    },
    enabled: !!patientId,
  });

  const { data: signed = [] } = useQuery({
    queryKey: ["patient_exams_urls", patientId, exams.map((e) => e.id).join(",")],
    queryFn: async () => {
      if (exams.length === 0) return [] as ExamWithUrl[];
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(exams.map((e) => e.file_path), 3600);
      if (error) throw error;
      return exams.map((e, i) => ({ ...e, url: data?.[i]?.signedUrl ?? "" }));
    },
    enabled: exams.length > 0,
  });

  const items: ExamWithUrl[] = signed.length > 0 ? signed : exams.map((e) => ({ ...e, url: "" }));

  const validate = useCallback((files: File[]) => {
    const valid: File[] = [];
    for (const f of files) {
      if (!ACCEPTED.includes(f.type)) {
        toast.error(`Formato inválido: ${f.name}. Use JPG, PNG ou WEBP.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`Arquivo muito grande: ${f.name} (máx. 10MB).`);
        continue;
      }
      valid.push(f);
    }
    return valid;
  }, []);

  const handleSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid = validate(Array.from(files));
    if (valid.length > 0) setPendingFiles(valid);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Clínica não identificada.");
      if (pendingFiles.length === 0) throw new Error("Nenhum arquivo selecionado.");
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id ?? null;

      for (const file of pendingFiles) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${clinicId}/${patientId}/${crypto.randomUUID()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;

        const { error: insErr } = await supabase.from("patient_exams").insert({
          clinic_id: clinicId,
          patient_id: patientId,
          file_path: path,
          file_type: fileType,
          notes: notes || null,
          created_by: userId,
        });
        if (insErr) {
          // rollback storage
          await supabase.storage.from(BUCKET).remove([path]);
          throw insErr;
        }
      }
    },
    onMutate: () => setUploading(true),
    onSettled: () => setUploading(false),
    onSuccess: () => {
      toast.success(`${pendingFiles.length} arquivo(s) enviado(s)`);
      setPendingFiles([]);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["patient_exams", patientId] });
    },
    onError: (e: any) => toast.error("Erro ao enviar: " + (e?.message ?? "desconhecido")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (exam: ExamWithUrl) => {
      const { error: rmErr } = await supabase.storage.from(BUCKET).remove([exam.file_path]);
      if (rmErr) throw rmErr;
      const { error } = await supabase.from("patient_exams").delete().eq("id", exam.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Exame removido");
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ["patient_exams", patientId] });
    },
    onError: (e: any) => toast.error("Erro ao remover: " + (e?.message ?? "desconhecido")),
  });

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i === null ? null : Math.min(items.length - 1, i + 1)));
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, items.length]);

  const activeImg = lightboxIdx !== null ? items[lightboxIdx] : null;

  return (
    <Card className="bg-white border-amber-400/30">
      <CardContent className="p-6 space-y-6">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleSelect(e.dataTransfer.files);
          }}
          className={`relative rounded-xl border-2 border-dashed bg-white transition-all p-8 text-center ${
            dragOver ? "border-[#103444] bg-amber-50/40" : "border-amber-400/30 hover:border-amber-400/60"
          }`}
        >
          <input
            id="exam-file-input"
            type="file"
            multiple
            accept={ACCEPTED_ATTR}
            className="hidden"
            onChange={(e) => handleSelect(e.target.files)}
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-[#103444]/5 flex items-center justify-center">
              <ImagePlus className="h-7 w-7 text-[#103444]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#103444]">
                Arraste imagens aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG ou WEBP · até 10MB por arquivo
              </p>
            </div>
            <label htmlFor="exam-file-input">
              <Button
                type="button"
                variant="outline"
                className="border-amber-400/40 text-[#103444]"
                disabled={uploading}
                asChild
              >
                <span>Selecionar arquivos</span>
              </Button>
            </label>
          </div>
        </div>

        {/* Pending files form */}
        {pendingFiles.length > 0 && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-50/30 p-4 space-y-4">
            <div className="text-sm font-semibold text-[#103444]">
              {pendingFiles.length} arquivo(s) prontos para envio
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#103444]">Tipo</Label>
                <Select value={fileType} onValueChange={setFileType} disabled={uploading}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#103444]">Observações (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={1}
                  className="bg-white"
                  disabled={uploading}
                />
              </div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {pendingFiles.map((f) => (
                <li key={f.name}>
                  · {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setPendingFiles([])}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={uploading}
                className="bg-[#103444] hover:bg-[#103444]/90"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...
                  </>
                ) : (
                  "Enviar"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Gallery */}
        <div>
          <h3 className="text-sm font-bold text-[#103444] uppercase tracking-wider mb-3">
            Galeria
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Nenhum exame enviado ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="group relative rounded-xl overflow-hidden border border-amber-400/30 bg-white shadow-sm hover:shadow-md transition-all cursor-zoom-in"
                  onClick={() => setLightboxIdx(idx)}
                >
                  <div className="aspect-square bg-muted/30 overflow-hidden">
                    {ex.url ? (
                      <img
                        src={ex.url}
                        alt={ex.file_type}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-[#103444] text-white border-0 shadow-sm">
                      {ex.file_type}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(ex);
                    }}
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="px-3 py-2 text-xs text-muted-foreground border-t border-amber-400/20">
                    {fmtDate(ex.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        <Dialog open={lightboxIdx !== null} onOpenChange={(o) => !o && setLightboxIdx(null)}>
          <DialogContent
            className="max-w-[100vw] w-screen h-screen sm:rounded-none p-0 bg-black/80 backdrop-blur-md border-0"
            onPointerDownOutside={() => setLightboxIdx(null)}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Visualizar exame</DialogTitle>
            </DialogHeader>
            {activeImg && (
              <div className="relative w-full h-full flex items-center justify-center">
                <button
                  type="button"
                  className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md"
                  onClick={() => setLightboxIdx(null)}
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
                {lightboxIdx !== null && lightboxIdx > 0 && (
                  <button
                    type="button"
                    className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md"
                    onClick={() => setLightboxIdx((i) => (i === null ? null : i - 1))}
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                {lightboxIdx !== null && lightboxIdx < items.length - 1 && (
                  <button
                    type="button"
                    className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md"
                    onClick={() => setLightboxIdx((i) => (i === null ? null : i + 1))}
                    aria-label="Próximo"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
                <img
                  src={activeImg.url}
                  alt={activeImg.file_type}
                  className="max-w-[95vw] max-h-[88vh] object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
                  <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div>
                      <Badge className="bg-amber-400 text-[#103444] border-0 mb-1">
                        {activeImg.file_type}
                      </Badge>
                      <p className="text-xs opacity-80">{fmtDate(activeImg.created_at)}</p>
                    </div>
                    {activeImg.notes && (
                      <p className="text-sm opacity-90 max-w-xl text-right">{activeImg.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm delete */}
        <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover exame?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O arquivo será apagado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  if (confirmDelete) deleteMutation.mutate(confirmDelete);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Removendo...
                  </>
                ) : (
                  "Remover"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
