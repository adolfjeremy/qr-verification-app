const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY || 're_TbXZaZfw_95B4CK7McaB9ooLBwudsrg2E');

async function test() {
  try {
    const response = await resend.emails.send({
      from: 'BAPP E-Signature <no-reply@bumiasriprimapratama.com>',
      to: 'adolfjazzy123@gmail.com',
      subject: 'Test Resend Delivery',
      html: '<p>Testing Resend from backend</p>'
    });
    console.log("Response:", response);
  } catch (error) {
    console.error("Error:", error);
  }
}
test();
