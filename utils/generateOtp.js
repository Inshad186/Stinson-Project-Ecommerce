
function generateOTP() {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP = OTP + digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}
module.exports = {
    generateOTP
}