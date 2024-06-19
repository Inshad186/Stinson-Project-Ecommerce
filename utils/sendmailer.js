const nodeMailer = require('nodemailer');

const transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user : process.env.SMTP_USER,
        pass : process.env.SMTP_PASS
    }
})

async function sendOTPEmail(userEmail,otpCode){
    try {
    console.log("User Email : "+userEmail,"OTP code : "+otpCode);
    const mailOptions = {
    from: process.env.SMTP_USER,
    to: userEmail,
    subject: 'Your OTP for Verification',
    text: `Your OTP for verification is: ${otpCode}`
    }; 

    console.log('OTP IS :' ,otpCode);

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId);
    } catch (error) {
        console.error('Error in sending email:', error);
        throw new Error('Failed to send OTP email.');
    }
}

module.exports = sendOTPEmail