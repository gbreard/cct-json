import { useEffect, useState } from "react";
import { useDocStore } from "../state/useDocStore";

export function useAutosave(intervalMs: number = 30000) {
  const { doc } = useDocStore();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!doc) return;

    const save = () => {
      setIsSaving(true);
      try {
        const key = `autosave_${doc.metadata.nombre_archivo}`;
        localStorage.setItem(key, JSON.stringify(doc));
        localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
        setLastSaved(new Date());
      } catch (error) {
        console.error("Error al guardar automáticamente:", error);
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

  return { lastSaved, isSaving };
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
