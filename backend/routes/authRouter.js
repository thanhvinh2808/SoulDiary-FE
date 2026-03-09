// routes/authRouter.js
const express = require("express");
const authController = require("../controller/authController");

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 */

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register (email/password)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Soul Diary
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/register", authController.register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login (email/password)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/login", authController.login);

/**
 * @openapi
 * /api/v1/auth/google:
 *   post:
 *     summary: Login with Google (client sends idToken)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID Token from client
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/google", authController.googleLogin);

/**
 * @openapi
 * /api/v1/auth/facebook:
 *   post:
 *     summary: Login with Facebook (client sends accessToken)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accessToken]
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Facebook Access Token from client
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/facebook", authController.facebookLogin);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token (web uses cookie refreshToken, mobile can send body.refreshToken)
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Only needed for mobile if not using cookie
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", authController.refresh);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout (clear refresh cookie, optionally revoke refresh in DB)
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional for mobile to revoke refresh token
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/logout", authController.logout);

/**
 * @openapi
 * /api/v1/auth/google-oauth:
 *   get:
 *     summary: Browser-based Google OAuth - opens OAuth consent, then redirects back with token
 *     tags: [Auth]
 *     parameters:
 *       - name: redirect
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Redirect URI after OAuth (e.g., souldiary://oauth-callback)
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent or back to app with token
 */
router.get("/google-oauth", authController.googleOAuthBrowser);

/**
 * @openapi
 * /api/v1/auth/facebook-oauth:
 *   get:
 *     summary: Browser-based Facebook OAuth - opens OAuth consent, then redirects back with token
 *     tags: [Auth]
 *     parameters:
 *       - name: redirect
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Redirect URI after OAuth (e.g., souldiary://oauth-callback)
 *     responses:
 *       302:
 *         description: Redirect to Facebook OAuth consent or back to app with token
 */
router.get("/facebook-oauth", authController.facebookOAuthBrowser);

/**
 * @openapi
 * /api/v1/auth/google-oauth-callback:
 *   get:
 *     summary: Google OAuth callback - Handle authorization code exchange
 *     tags: [Auth]
 *     parameters:
 *       - name: code
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect back to app with token or error
 */
router.get("/google-oauth-callback", authController.googleOAuthCallback);

/**
 * @openapi
 * /api/v1/auth/facebook-oauth-callback:
 *   get:
 *     summary: Facebook OAuth callback - Handle authorization code exchange
 *     tags: [Auth]
 *     parameters:
 *       - name: code
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect back to app with token or error
 */
router.get("/facebook-oauth-callback", authController.facebookOAuthCallback);

module.exports = router;
