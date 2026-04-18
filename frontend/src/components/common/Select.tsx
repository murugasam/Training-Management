import { type SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => {
    const fieldClass = error ? 'field has-error' : 'field'

    return (
      <div className={fieldClass}>
        {label && <label htmlFor={props.id}>{label}</label>}
        <select
          ref={ref}
          className={className}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="error-text" role="alert">{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'