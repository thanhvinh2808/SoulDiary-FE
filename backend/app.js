const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const setupSwagger = require("./swagger");

app.use(cors());
app.use(express.json());

const authRouter = require("./routes/authRouter");
const journalRouter = require("./routes/journalRouter");
const otpRouter = require("./routes/otpRouter");
const userRouter = require("./routes/userRouter");

app.use(cookieParser());
setupSwagger(app);

//route
app.get("/api/v1/health", (req, res) => res.json({ ok: true }));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/journals", journalRouter);
app.use("/api/v1/otp", otpRouter);

app.use((req, res, next) => {
  next(new Error(`Can't find ${req.originalUrl} on this server!`)); 
});

const globalErrorHandler = require("./controller/errorController");
app.use(globalErrorHandler);

module.exports = app;
