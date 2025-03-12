import React from 'react';

export const Card = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'default':
        return 'bg-white border border-slate-200';
      case 'elevated':
        return 'bg-white shadow-md';
      case 'outlined':
        return 'bg-white border border-slate-200';
      case 'filled':
        return 'bg-secondary-50';
      default:
        return 'bg-white border border-slate-200';
    }
  };

  return (
    <div
      className={`rounded-xl p-5 ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3
      className={`text-lg font-semibold text-foreground ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-sm text-secondary-500 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`mt-4 pt-4 border-t border-slate-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
