import { diffHtml } from "../lib/diff";

interface DiffModalProps {
  open: boolean;
  before: any;
  after: any;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DiffModal({ open, before, after, onClose, onConfirm }: DiffModalProps) {
  if (!open) return null;

  const htmlDiff = diffHtml(before, after);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          maxWidth: "90%",
          maxHeight: "90%",
          width: "1000px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h3 style={{ margin: 0 }}>Cambios Realizados</h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#999"
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px"
          }}
        >
          <style>
            {`
              .jsondiffpatch-delta {
                font-family: 'Courier New', monospace;
                font-size: 14px;
              }
              .jsondiffpatch-added {
                background-color: #d4edda;
              }
              .jsondiffpatch-deleted {
                background-color: #f8d7da;
              }
              .jsondiffpatch-modified {
                background-color: #fff3cd;
              }
              .jsondiffpatch-unchanged {
                color: #999;
              }
            `}
          </style>
          <div dangerouslySetInnerHTML={{ __html: htmlDiff }} />
        </div>

        <div
          style={{
            padding: "20px",
            borderTop: "1px solid #ddd",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end"
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "#f0f0f0",
              border: "1px solid #ddd",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Confirmar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
