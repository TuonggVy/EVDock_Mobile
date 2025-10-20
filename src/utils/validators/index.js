// Validation functions

// Required field validation
export const isRequired = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'This field is required';
  }
  return null;
};

// Email validation
export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

// Password validation
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character';
  }
  
  return null;
};

// Phone number validation (Vietnamese format)
export const validatePhoneNumber = (phone) => {
  if (!phone) return 'Phone number is required';
  
  const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
  const cleanPhone = phone.replace(/\s/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return 'Please enter a valid Vietnamese phone number';
  }
  
  return null;
};

// Confirm password validation
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  
  return null;
};

// Minimum length validation
export const validateMinLength = (value, minLength) => {
  if (!value) return 'This field is required';
  
  if (value.length < minLength) {
    return `Must be at least ${minLength} characters long`;
  }
  
  return null;
};

// Maximum length validation
export const validateMaxLength = (value, maxLength) => {
  if (value && value.length > maxLength) {
    return `Must be no more than ${maxLength} characters long`;
  }
  
  return null;
};

// Number validation
export const validateNumber = (value) => {
  if (!value) return 'This field is required';
  
  if (isNaN(value)) {
    return 'Must be a valid number';
  }
  
  return null;
};

// Positive number validation
export const validatePositiveNumber = (value) => {
  const numberError = validateNumber(value);
  if (numberError) return numberError;
  
  if (parseFloat(value) <= 0) {
    return 'Must be a positive number';
  }
  
  return null;
};
