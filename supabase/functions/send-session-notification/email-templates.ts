export const getSessionCreatedEmail = (
  studentName: string,
  tutorName: string,
  subject: string,
  date: string,
  time: string
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Arial', sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px dashed #e4e4e7; padding-bottom: 20px; margin-bottom: 20px; }
    h1 { color: #18181b; font-size: 24px; }
    p { color: #52525b; line-height: 1.6; }
    .details { background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .detail-row { margin-bottom: 10px; }
    .label { font-weight: bold; color: #18181b; }
    .footer { text-align: center; margin-top: 30px; color: #a1a1aa; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Session Request 📝</h1>
    </div>
    <p>Hi ${tutorName},</p>
    <p>Great news! <strong>${studentName}</strong> has requested a new tutoring session with you.</p>
    
    <div class="details">
      <div class="detail-row"><span class="label">Subject:</span> ${subject}</div>
      <div class="detail-row"><span class="label">Date:</span> ${date}</div>
      <div class="detail-row"><span class="label">Time:</span> ${time}</div>
    </div>
    
    <p>Please log in to your dashboard to review and confirm or decline this request.</p>
    
    <div class="footer">
      <p>Happy Tutoring,<br>The Tutor Quest Team</p>
    </div>
  </div>
</body>
</html>
`;

export const getSessionConfirmedEmail = (
  studentName: string,
  tutorName: string,
  subject: string,
  date: string,
  time: string
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Arial', sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px dashed #e4e4e7; padding-bottom: 20px; margin-bottom: 20px; }
    h1 { color: #166534; font-size: 24px; }
    p { color: #52525b; line-height: 1.6; }
    .details { background-color: #dcfce7; border: 2px solid #4ade80; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .detail-row { margin-bottom: 10px; }
    .label { font-weight: bold; color: #166534; }
    .footer { text-align: center; margin-top: 30px; color: #a1a1aa; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Session Confirmed! ✅</h1>
    </div>
    <p>Hi ${studentName},</p>
    <p>Awesome! Your tutoring session with <strong>${tutorName}</strong> has been officially confirmed.</p>
    
    <div class="details">
      <div class="detail-row"><span class="label">Subject:</span> ${subject}</div>
      <div class="detail-row"><span class="label">Date:</span> ${date}</div>
      <div class="detail-row"><span class="label">Time:</span> ${time}</div>
    </div>
    
    <p>Get your notes ready and prepare for a great learning experience.</p>
    
    <div class="footer">
      <p>Happy Learning,<br>The Tutor Quest Team</p>
    </div>
  </div>
</body>
</html>
`;

export const getSessionCanceledEmail = (
  studentName: string,
  tutorName: string,
  subject: string,
  date: string,
  time: string,
  isTutor: boolean
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Arial', sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px dashed #e4e4e7; padding-bottom: 20px; margin-bottom: 20px; }
    h1 { color: #991b1b; font-size: 24px; }
    p { color: #52525b; line-height: 1.6; }
    .details { background-color: #fee2e2; border: 2px solid #f87171; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .detail-row { margin-bottom: 10px; }
    .label { font-weight: bold; color: #991b1b; }
    .footer { text-align: center; margin-top: 30px; color: #a1a1aa; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Session Canceled ❌</h1>
    </div>
    <p>Hi ${isTutor ? tutorName : studentName},</p>
    <p>Unfortunately, your upcoming session for <strong>${subject}</strong> has been canceled.</p>
    
    <div class="details">
      <div class="detail-row"><span class="label">With:</span> ${isTutor ? studentName : tutorName}</div>
      <div class="detail-row"><span class="label">Date:</span> ${date}</div>
      <div class="detail-row"><span class="label">Time:</span> ${time}</div>
    </div>
    
    <p>If you need to reschedule, please visit the platform and find a new time.</p>
    
    <div class="footer">
      <p>Best,<br>The Tutor Quest Team</p>
    </div>
  </div>
</body>
</html>
`;
