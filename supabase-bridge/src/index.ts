const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const workshopsRouter = require("./routes/workshops");
const testimonialsRouter = require("./routes/testimonials");
const ordersRouter = require("./routes/orders");
const pendingUsersRouter = require("./routes/pendingUsers");
const eventsRouter = require("./routes/events");
const sessionSpotsRouter = require("./routes/sessionSpots");
const couponsRouter = require("./routes/coupons");
// ... (other routers)
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/workshops", workshopsRouter);
app.use("/testimonials", testimonialsRouter);
app.use("/orders", ordersRouter);
app.use("/pending-users", pendingUsersRouter);
app.use("/events", eventsRouter);
app.use("/coupons", couponsRouter);
app.use("/", sessionSpotsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Supabase Bridge server running on port ${PORT}`);
});

module.exports = app;
