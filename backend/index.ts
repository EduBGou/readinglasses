import express from 'express';

const app = express();
import scanRoutes from './routes/scan.ts'
import translateRoutes from './routes/translate.ts'

const post = 3000;

app.use('/scan', scanRoutes)
app.use('/translate', translateRoutes)

app.listen(post, () => {
  console.log(`Server running on http://localhost:${post}`);
});