import { useEffect, useState } from "react";
import { useDocStore } from "../state/useDocStore";

export type SyncStatus = 'idle' | 'saving' | 'synced' | 'error';

export function useAutosave(intervalMs: number = 30000, hasLock: boolean = false) {
  const { doc } = useDocStore();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    if (!doc || !hasLock) return; // Solo guardar si tenemos el lock

    const save = async () => {
      setIsSaving(true);
      setSyncStatus('saving');

      try {
        // Guardar SOLO en servidor (base de datos)
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
        console.log('💾 Guardado en servidor:', result);
        setSyncStatus('synced');
        setLastSaved(new Date());

        // Volver a idle después de 2 segundos
        setTimeout(() => setSyncStatus('idle'), 2000);
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
  }, [doc, intervalMs, hasLock]);

  return { lastSaved, isSaving, syncStatus };
}

// Función para obtener datos guardados en servidor (ÚNICA FUENTE DE DATOS)
export async function getSavedData(fileName: string) {
  try {
    const response = await fetch(`/api/autosave?fileName=${encodeURIComponent(fileName)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No hay datos guardados para este documento
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
    console.error("Error al recuperar datos guardados:", error);
    return null;
  }
}

// Mantener funciones legacy para compatibilidad (retornan null ya que no usamos localStorage)
export function getAutosaveData(_fileName: string) {
  return null; // Ya no usamos localStorage
}

export function clearAutosave(_fileName: string) {
  // No-op: ya no usamos localStorage
}

// Alias para compatibilidad
export const getCloudAutosave = getSavedData;
