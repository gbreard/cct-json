import { useEffect, useState } from "react";
import { useDocStore } from "../state/useDocStore";

export type SyncStatus = 'idle' | 'saving' | 'syncing' | 'synced' | 'error';

export function useAutosave(intervalMs: number = 30000) {
  const { doc } = useDocStore();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastCloudSync, setLastCloudSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!doc) return;

    const save = async () => {
      setIsSaving(true);
      setSyncStatus('saving');

      try {
        // 1. INMEDIATO: Guardar en localStorage (0ms)
        const key = `autosave_${doc.metadata.nombre_archivo}`;
        localStorage.setItem(key, JSON.stringify(doc));
        localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
        setLastSaved(new Date());

        // 2. BACKGROUND: Sincronizar con cloud
        setSyncStatus('syncing');

        try {
          const response = await fetch('/api/autosave', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: doc.metadata.nombre_archivo,
              data: doc,
              userName: localStorage.getItem('userName') || 'Usuario'
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.log('☁️ Sincronizado con servidor:', result);
          setSyncStatus('synced');
          setLastCloudSync(new Date());

          // Volver a idle después de 2 segundos
          setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (cloudError) {
          console.warn('⚠️ Error sincronizando con servidor:', cloudError);
          console.log('✅ Pero el guardado local está OK');
          setSyncStatus('error');

          // Volver a idle después de 3 segundos
          setTimeout(() => setSyncStatus('idle'), 3000);
        }
      } catch (error) {
        console.error("❌ Error al guardar automáticamente:", error);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } finally {
        setTimeout(() => setIsSaving(false), 1000);
      }
    };

    // Guardar inmediatamente al cargar
    save();

    // Configurar intervalo de guardado automático
    const interval = setInterval(save, intervalMs);

    return () => clearInterval(interval);
  }, [doc, intervalMs]);

  return { lastSaved, isSaving, syncStatus, lastCloudSync };
}

export function getAutosaveData(fileName: string) {
  try {
    const key = `autosave_${fileName}`;
    const data = localStorage.getItem(key);
    const timestamp = localStorage.getItem(`${key}_timestamp`);

    if (!data) return null;

    return {
      data: JSON.parse(data),
      timestamp: timestamp ? new Date(timestamp) : null
    };
  } catch (error) {
    console.error("Error al recuperar datos de autosave:", error);
    return null;
  }
}

export function clearAutosave(fileName: string) {
  try {
    const key = `autosave_${fileName}`;
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_timestamp`);
  } catch (error) {
    console.error("Error al limpiar autosave:", error);
  }
}

export async function getCloudAutosave(fileName: string) {
  try {
    const response = await fetch(`/api/autosave?fileName=${encodeURIComponent(fileName)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No hay autosave en la nube
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      data: result.data,
      timestamp: result.timestamp ? new Date(result.timestamp) : null,
      userName: result.userName
    };
  } catch (error) {
    console.error("Error al recuperar autosave de la nube:", error);
    return null;
  }
}
