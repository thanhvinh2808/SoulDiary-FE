const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const setupSwagger = require("./swagger");

app.use(cors());
app.use(express.json());
const authRouter = require("./routes/authRouter");
const diaryRouter = require("./routes/diaryRouter");
app.use(cookieParser());
setupSwagger(app);
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *               example:
 *                 ok: true
 */
app.get("/health", (req, res) => res.json({ ok: true }));

//route
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/diaries", diaryRouter);
app.use((req, res, next) => {
  next(new Error(`Can't find ${req.originalUrl} on this server!`)); 
});

const globalErrorHandler = require("./controller/errorController");
app.use(globalErrorHandler);

module.exports = app;
