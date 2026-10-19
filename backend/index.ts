import express from 'express';
import cors from 'cors'

const app = express();
const port = process.env.EXPO_PUBLIC_BACKEND_PORT;
const frontendUrl = process.env.EXPO_PUBLIC_FRONTEND_URL

import askRoutes from './routes/ask.ts'
import scanRoutes from './routes/scan.ts'
import translateRoutes from './routes/translate.ts'

app.use(cors({
  origin: [
    "http://localhost:8081",
    frontendUrl,
    /^http:\/\/192\.168\.\d+\.\d+:8081$/
  ]
}));

app.use(express.json());

app.use('/ask', askRoutes)
app.use('/scan', scanRoutes)
app.use('/translate', translateRoutes)

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${port}`);
});