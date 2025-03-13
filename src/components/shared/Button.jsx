import { Button as HeroButton } from '@heroui/react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  isDisabled = false,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white hover:bg-primary-600 focus:ring-primary-500';
      case 'secondary':
        return 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 focus:ring-secondary-500';
      case 'outline':
        return 'border border-primary text-primary hover:bg-primary-50 focus:ring-primary-500';
      case 'danger':
        return 'bg-danger text-white hover:bg-danger-600 focus:ring-danger-500';
      case 'success':
        return 'bg-success text-white hover:bg-success-600 focus:ring-success-500';
      default:
        return 'bg-primary text-white hover:bg-primary-600 focus:ring-primary-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm py-1 px-3';
      case 'md':
        return 'text-base py-2 px-4';
      case 'lg':
        return 'text-lg py-3 px-6';
      default:
        return 'text-base py-2 px-4';
    }
  };

  return (
    <HeroButton
      isLoading={isLoading}
      isDisabled={isDisabled}
      className={`rounded-md font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      {...props}
    >
      {children}
    </HeroButton>
  );
};
