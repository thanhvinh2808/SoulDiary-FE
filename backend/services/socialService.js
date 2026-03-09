const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const crypto = require("crypto");

// ====== OAUTH STATE MANAGEMENT ======
// In-memory storage for OAuth state (maps state -> appRedirectUri)
const oauthStateMap = new Map();

// Store OAuth state with app redirect URI
exports.storeOAuthState = (state, appRedirectUri) => {
  oauthStateMap.set(state, { appRedirectUri, timestamp: Date.now() });
  // Auto-cleanup after 15 minutes
  setTimeout(() => oauthStateMap.delete(state), 15 * 60 * 1000);
};

// Retrieve and validate OAuth state
exports.getOAuthState = (state) => {
  const data = oauthStateMap.get(state);
  if (!data) return null;
  // Check if state hasn't expired (15 minutes)
  if (Date.now() - data.timestamp > 15 * 60 * 1000) {
    oauthStateMap.delete(state);
    return null;
  }
  oauthStateMap.delete(state); // Consume state (single-use)
  return data;
};

// ====== BROWSER-BASED OAUTH - GENERATE CONSENT URLs ======
// Generate Google OAuth consent URL
exports.generateGoogleConsentUrl = (backendCallbackUri, appRedirectUri) => {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    backendCallbackUri
  );

  const state = crypto.randomBytes(32).toString('hex');
  exports.storeOAuthState(state, appRedirectUri);
  
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    state,
  });

  return { authUrl, state };
};

// Generate Facebook OAuth consent URL
exports.generateFacebookConsentUrl = (backendCallbackUri, appRedirectUri) => {
  const state = crypto.randomBytes(20).toString('hex');
  const fbAuthUrl = 'https://www.facebook.com/v19.0/dialog/oauth';
  
  exports.storeOAuthState(state, appRedirectUri);
  
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID,
    redirect_uri: backendCallbackUri,
    scope: 'public_profile,email',
    state,
  });

  return {
    authUrl: `${fbAuthUrl}?${params.toString()}`,
    state,
  };
};

// ====== BROWSER-BASED OAUTH - EXCHANGE CODES FOR TOKENS ======
// Exchange Google auth code for ID token
exports.exchangeGoogleCode = async (code, redirectUri) => {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const { tokens } = await client.getToken(code);
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  return {
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
    payload: ticket.getPayload(),
  };
};

// Exchange Facebook auth code for access token
exports.exchangeFacebookCode = async (code, redirectUri) => {
  const tokenUrl = 'https://graph.facebook.com/v19.0/oauth/access_token';
  
  const response = await axios.get(tokenUrl, {
    params: {
      client_id: process.env.FACEBOOK_CLIENT_ID,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET,
      redirect_uri: redirectUri,
      code,
    },
  });

  const accessToken = response.data.access_token;

  // Get user info
  const userResponse = await axios.get('https://graph.facebook.com/me', {
    params: {
      access_token: accessToken,
      fields: 'id,name,email,picture',
    },
  });

  return {
    accessToken,
    userData: userResponse.data,
  };
};
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
