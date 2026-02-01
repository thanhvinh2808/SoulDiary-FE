const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

exports.verifyGoogleIdToken = async (token) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  // 1. Kiểm tra định dạng JWT (ID Token)
  const isJwt = token.split(".").length === 3;

  if (!isJwt) {
    try {
      const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = response.data;
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified,
      };
    } catch (error) {
      console.error("❌ Google Access Token verification failed:", error.response?.data || error.message);
      throw new Error("Xác thực Google Access Token thất bại");
    }
  }

  // 2. Nếu là ID Token (JWT), thực hiện verify
  const defaultAudiences = [
    "41247382516-1nbdp00km72e261hcipuqcamb9dttu8d.apps.googleusercontent.com",
    "41247382516-hedjbqieuige5lfkolt3flctolms69ta.apps.googleusercontent.com",
    "41247382516-hbui90gsqmtbdagni8sho68ffhfisv4p.apps.googleusercontent.com",
  ];
  
  let envAudiences = [];
  if (process.env.GOOGLE_CLIENT_IDS) {
    envAudiences = process.env.GOOGLE_CLIENT_IDS.split(',').map(s => s.trim()).filter(s => s);
  }
  
  // Gộp danh sách ID mặc định và ID từ biến môi trường
  const AUDIENCES = [...new Set([...envAudiences, ...defaultAudiences])];

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: AUDIENCES,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error("❌ Google ID Token verification failed:", error.message);
    
    // Fallback: Thử gọi userinfo API nếu verify token thất bại (đề phòng lỗi audience hoặc signature)
    try {
      const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        sub: response.data.sub,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
      };
    } catch (innerError) {
      throw new Error(`Google Login Failed: ${error.message}`);
    }
  }
};

exports.verifyFacebookAccessToken = async (accessToken) => {
  try {
    const response = await axios.get("https://graph.facebook.com/me", {
      params: { 
        access_token: accessToken, 
        fields: "id,name,email,picture.type(large)" 
      },
    });
    
    const data = response.data;
    if (!data.id) throw new Error("Invalid Facebook token");

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      picture: data.picture?.data?.url
    };
  } catch (error) {
    console.error("❌ Facebook Token verification failed:", error.response?.data || error.message);
    throw new Error("Facebook authentication failed");
  }
};
