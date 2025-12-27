import nodemailer from 'nodemailer';

const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"CA Successful" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Email Verification OTP',
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP for email verification is:</p>
      <h3 style="font-size: 24px; font-weight: bold; color: #333; text-align: center; padding: 10px; border: 2px solid #007bff; border-radius: 5px; display: inline-block;">${otp}</h3>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });
};

export default sendOTPEmail;
