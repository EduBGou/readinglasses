import express from 'express';
const app = express();
const post = 3000;

import askRoutes from './routes/ask.ts'
import scanRoutes from './routes/scan.ts'
import translateRoutes from './routes/translate.ts'

app.use(express.json());
app.use('/ask', askRoutes)
app.use('/scan', scanRoutes)
app.use('/translate', translateRoutes)

app.listen(post, () => {
  console.log(`Server running on http://localhost:${post}`);
});