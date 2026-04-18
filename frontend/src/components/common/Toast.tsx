interface ToastProps {
  message: string
  kind: 'success' | 'error'
}

export function Toast({ message, kind }: ToastProps) {
  return (
    <div className={`toast toast-${kind}`}>
      {kind === 'success' ? '✓ ' : '✕ '}{message}
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{ id: number; message: string; kind: 'success' | 'error' }>
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(t => (
        <Toast
          key={t.id}
          message={t.message}
          kind={t.kind}
        />
      ))}
    </div>
  )
}