const http = require('http');

const loginData = JSON.stringify({
  email: 'hamza@gmail.com',
  password: 'password123'
});

const reqLogin = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}, (resLogin) => {
  let body = '';
  resLogin.on('data', chunk => body += chunk);
  resLogin.on('end', () => {
    const data = JSON.parse(body);
    if (!data.success) {
      console.error("Login failed:", data);
      return;
    }
    
    const token = data.token;
    console.log("Logged in! Token acquired.");
    
    // Fetch Profile
    const reqProfile = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (resProfile) => {
      let profileBody = '';
      resProfile.on('data', chunk => profileBody += chunk);
      resProfile.on('end', () => {
        console.log("Profile Response:", JSON.parse(profileBody));
        
        // Fetch Wallet
        const reqWallet = http.request({
          hostname: 'localhost',
          port: 5000,
          path: '/api/wallet',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }, (resWallet) => {
          let walletBody = '';
          resWallet.on('data', chunk => walletBody += chunk);
          resWallet.on('end', () => {
            console.log("Wallet Response:", JSON.parse(walletBody));
          });
        });
        reqWallet.end();
      });
    });
    reqProfile.end();
  });
});

reqLogin.write(loginData);
reqLogin.end();
