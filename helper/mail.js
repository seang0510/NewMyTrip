const nodemailer = require('nodemailer'); // 모듈 import

async function wrapedSendMail(mailOptions){
  return new Promise((resolve, reject)=>{
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // 사용할 이메일 서비스의 호스트 주소 (gamil)
      port: process.env.SEND_PORT, // 이메일 서비스의 포트 번호 (일반적으로 25, 587, 465, 2525 중 하나 사용)
      auth: { // 이메일 서버 인증을 위한 사용자의 이메일 주소와 비밀번호
          user: process.env.SEND_EMAIL, // 나의 (작성자) 이메일 주소
          pass: process.env.SEND_EMAIL_PASSWORD // 이메일의 비밀번호
      },
    });

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log("error is " + error);
        resolve(false); // or use rejcet(false) but then you will have to handle errors
      } 
      else {
        console.log('Email sent: ' + info.response);
        resolve(true);
      }
    });
  });
 }

 module.exports = { wrapedSendMail };