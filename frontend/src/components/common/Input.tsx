import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const fieldClass = error ? 'field has-error' : 'field'

    return (
      <div className={fieldClass}>
        {label && <label htmlFor={props.id}>{label}</label>}
        <input
          ref={ref}
          className={className}
          {...props}
        />
        {error && <span className="error-text" role="alert">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'