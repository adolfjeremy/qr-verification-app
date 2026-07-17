const axios = require('axios');
async function test() {
  try {
    // We need to login first to get a token, because the endpoint is protected
    const login = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@bumiasriprimapratama.com', // or whatever the admin is
      password: 'password123' // I don't know the password
    });
  } catch (error) {
    console.log(error.message);
  }
}
test();
