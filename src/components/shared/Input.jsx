import React from 'react';

export const Input = React.forwardRef(
  ({ className = '', type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
          error ? 'border-danger focus:border-danger focus:ring-danger' : ''
        } ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export const Label = ({
  children,
  className = '',
  htmlFor,
  required = false,
  ...props
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-secondary-700 mb-1 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-danger ml-1">*</span>}
    </label>
  );
};

export const FormGroup = ({ children, className = '', error, ...props }) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};
