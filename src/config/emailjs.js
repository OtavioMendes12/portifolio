// EmailJS: chaves públicas (ok no navegador). Configure em .env.local / Vercel.
export const emailjsConfig = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateForMe: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FOR_ME,
  templateForSender: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FOR_SENDER,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

export const isEmailjsConfigured = () =>
  Boolean(emailjsConfig.serviceId && emailjsConfig.templateForMe && emailjsConfig.publicKey);
