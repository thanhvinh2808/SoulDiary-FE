// services/socialService.js
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

exports.verifyGoogleIdToken = async (token) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  // 1. Kiểm tra nếu là Access Token (thường bắt đầu bằng ya29. và không có dấu chấm phân cách JWT)
  if (token.startsWith("ya29.") || token.split(".").length !== 3) {
    console.log("Ticket: Access Token detected, fetching userinfo from Google API...");
    try {
      const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = response.data;
      // Map lại các trường cho giống với payload của ID Token
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified,
      };
    } catch (error) {
      console.error("❌ Google Access Token verification failed:", error.response?.data || error.message);
      throw new Error("Invalid Google Access Token");
    }
  }

  // 2. Nếu là ID Token (JWT), thực hiện verify bình thường
  const AUDIENCES = [
    process.env.GOOGLE_CLIENT_ID,
    "41247382516-hbui90gsqmtbdagni8sho68ffhfisv4p.apps.googleusercontent.com", // iOS
    "41247382516-hedjbqieuige5lfkolt3flctolms69ta.apps.googleusercontent.com", // Android
    "41247382516-1nbdp00km72e261hcipuqcamb9dttu8d.apps.googleusercontent.com"  // Web
  ];

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: AUDIENCES,
  });

  return ticket.getPayload();
};

exports.verifyFacebookAccessToken = async (accessToken) => {
  const response = await axios.get("https://graph.facebook.com/me", {
    params: { access_token: accessToken, fields: "id,name,email,picture" },
  });
  return response.data; // { id, name, email?, picture? }
};
