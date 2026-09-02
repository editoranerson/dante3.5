import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { supabase, MEDIA_BUCKET } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

interface Props {
  onUploaded: (url: string) => void;
  currentUrl?: string;
  folder?: string;
  label?: string;
}

export function ImageUpload({ onUploaded, currentUrl, folder = 'misc', label = 'Imagem' }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');

  const handle = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (error) {
        toast('Falha no upload da imagem.', 'error');
        return;
      }
      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      const url = data.publicUrl;
      setPreview(url);
      onUploaded(url);
      toast('Imagem enviada!', 'success');
    } catch {
      toast('Erro inesperado ao enviar imagem.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-700">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-grape-300/40">
              <Upload size={20} />
            </div>
          )}
        </div>
        <label className="btn-ghost cursor-pointer">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Enviando...' : 'Enviar imagem'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handle(f);
            }}
          />
        </label>
      </div>
    </div>
  );
}
