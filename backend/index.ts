import express from 'express';

const app = express();
import scanRoutes from './routes/scan.ts'

const post = 3000;

app.use('/scan', scanRoutes)

app.listen(post, () => {
  console.log(`Server running on http://localhost:${post}`);
});