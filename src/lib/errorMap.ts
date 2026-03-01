const MAP: Record<string, { field: string; message: string }> = {
  email_already_registered:  { field: 'email',           message: 'This email is already in use.' },
  email_invalid_format:      { field: 'email',           message: 'Enter a valid email address.' },
  phone_invalid_length:      { field: 'phone',           message: 'Enter a valid phone number.' },
  password_too_short:        { field: 'password',        message: 'Min 8 characters.' },
  passwords_mismatch:        { field: 'confirmPassword', message: 'Passwords do not match.' },
  dob_underage:              { field: 'dob',             message: 'Must be 18 or older.' },
  terms_not_accepted:        { field: 'termsAccepted',   message: 'Accept terms to continue.' },
  INVALID_CREDENTIALS:       { field: 'email',           message: 'Incorrect email or password.' },
  PROMO_EXPIRED:             { field: 'promoCode',       message: 'This promo code has expired.' },
  PROMO_MIN_ORDER:           { field: 'promoCode',       message: 'Minimum order not met for this code.' },
  ORDER_MINIMUM_NOT_MET:     { field: 'root',            message: 'Restaurant minimum order not met.' },
};
export function mapServerErrorsToForm(error: any, setError: Function) {
  if (error?.fields) {
    Object.keys(error.fields).forEach(code => {
      const m = MAP[code]; if (m) setError(m.field, { message: m.message });
    });
  } else if (error?.code && MAP[error.code]) {
    const { field, message } = MAP[error.code];
    setError(field, { message });
  }
}