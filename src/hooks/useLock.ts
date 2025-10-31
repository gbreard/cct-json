import { useEffect, useState, useCallback, useRef } from 'react';

export interface LockInfo {
  locked: boolean;
  userName?: string;
  timestamp?: string;
  lastHeartbeat?: string;
}

// Generar ID de sesión único
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Obtener o crear sessionId persistente
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('cct_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('cct_session_id', sessionId);
  }
  return sessionId;
}

export function useLock(fileName: string | null, userName: string) {
  const [lockInfo, setLockInfo] = useState<LockInfo>({ locked: false });
  const [hasLock, setHasLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef(getSessionId());
  const heartbeatInterval = useRef<number | null>(null);

  // Verificar estado del lock
  const checkLock = useCallback(async () => {
    if (!fileName) return;

    try {
      const response = await fetch(`/api/lock?fileName=${encodeURIComponent(fileName)}`);
      const data = await response.json();

      setLockInfo(data);

      if (data.locked && data.userName) {
        setError(`📌 Documento bloqueado por: ${data.userName}`);
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error checking lock:', err);
      setError('Error verificando el estado del documento');
    }
  }, [fileName]);

  // Adquirir lock
  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!fileName) return false;

    try {
      const response = await fetch(`/api/lock?fileName=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          sessionId: sessionId.current,
          action: 'acquire'
        })
      });

      const data = await response.json();

      if (response.status === 423) {
        // 423 Locked - documento ya está bloqueado
        setLockInfo({ locked: true, ...data });
        setHasLock(false);
        setError(`📌 No se puede editar: ${data.userName} está trabajando en este documento`);
        return false;
      }

      if (response.ok) {
        setHasLock(true);
        setLockInfo({ locked: true, userName, ...data.lock });
        setError(null);
        console.log('✅ Lock adquirido:', data);
        return true;
      }

      throw new Error(data.message || 'Error al adquirir lock');
    } catch (err) {
      console.error('Error acquiring lock:', err);
      setError('Error al intentar bloquear el documento');
      return false;
    }
  }, [fileName, userName]);

  // Renovar lock (heartbeat)
  const renewLock = useCallback(async () => {
    if (!fileName || !hasLock) return;

    try {
      const response = await fetch(`/api/lock?fileName=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          sessionId: sessionId.current,
          action: 'heartbeat'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💓 Heartbeat enviado:', new Date().toLocaleTimeString());
        setLockInfo({ locked: true, ...data.lock });
      } else {
        console.warn('⚠️ Heartbeat falló - perdimos el lock');
        setHasLock(false);
        setError('Se perdió el bloqueo del documento. Otro usuario pudo haberlo tomado.');
      }
    } catch (err) {
      console.error('Error renewing lock:', err);
    }
  }, [fileName, userName, hasLock]);

  // Liberar lock
  const releaseLock = useCallback(async () => {
    if (!fileName || !hasLock) return;

    try {
      const response = await fetch(`/api/lock?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current
        })
      });

      if (response.ok) {
        console.log('✅ Lock liberado');
        setHasLock(false);
        setLockInfo({ locked: false });
        setError(null);
      }
    } catch (err) {
      console.error('Error releasing lock:', err);
    }
  }, [fileName, hasLock]);

  // Heartbeat automático cada 60 segundos
  useEffect(() => {
    if (hasLock && fileName) {
      // Enviar heartbeat inmediatamente
      renewLock();

      // Configurar intervalo de heartbeat
      heartbeatInterval.current = window.setInterval(renewLock, 60 * 1000); // Cada 60 segundos

      return () => {
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }
      };
    }
  }, [hasLock, fileName, renewLock]);

  // Liberar lock al desmontar o al cerrar ventana
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasLock) {
        // Usar sendBeacon para asegurar que se envíe antes de cerrar
        const data = JSON.stringify({ sessionId: sessionId.current });
        navigator.sendBeacon(
          `/api/lock?fileName=${encodeURIComponent(fileName!)}`,
          new Blob([data], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // También liberar al desmontar el componente
      if (hasLock && fileName) {
        releaseLock();
      }
    };
  }, [hasLock, fileName, releaseLock]);

  return {
    lockInfo,
    hasLock,
    error,
    checkLock,
    acquireLock,
    releaseLock
  };
}
