import emailjs from '@emailjs/browser';

const PUBLIC_KEY = 'LoJus5ba3Tc7anrdE'; // Your public key
const SERVICE_ID = 'service_iak1hv6'; // Create in EmailJS dashboard
const RESET_PASSWORD_TEMPLATE_ID = 'template_8qt81cc'; 
const WELCOME_TEMPLATE_ID = 'template_2x9759n';

export const sendPasswordResetEmail = (email, resetLink) => {
  return emailjs.send(
    SERVICE_ID,
    RESET_PASSWORD_TEMPLATE_ID,
    {
      to_email: email,
      reset_link: resetLink,
      app_name: 'Optread',
      subject: 'Password Reset Request',
    },
    PUBLIC_KEY
  );
};

export const sendWelcomeEmail = (email, subscriber, book_title, book_link, coupon_code) => {
  return emailjs.send(
    SERVICE_ID,
    WELCOME_TEMPLATE_ID,
    {
      to_email: email,
      subscriber: subscriber,
      book_title: book_title,
      book_link: book_link,
      coupon_code: coupon_code,
      app_name: 'Optread',
      subject: 'Welcome to Optread!',
    },
    PUBLIC_KEY
  );
};