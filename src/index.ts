import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as authCtrl from './auth/auth.controller';
import { requireAuth } from './auth/auth.middleware';
import * as recipesCtrl from './recipes/recipes.controller';
//import rateLimit from 'express-rate-limit';

dotenv.config();

import { NextFunction, Request, Response } from 'express';
import register, {appId, httpRequestDuration, httpRequestErrors, httpRequestsTotal} from "./metrics";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use((req, res, next) => {
  const start = process.hrtime(); // high-resolution timer

  res.on("finish", () => {
    httpRequestsTotal.inc({ method: req.method, route: req.route?.path || req.path, status: res.statusCode, app: appId });

    if (res.statusCode >= 400) {
      httpRequestErrors.inc({ method: req.method, route: req.route?.path || req.path, status: res.statusCode, app: appId });
    }
    // record duration
    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9; // convert to seconds

    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status: res.statusCode,
        app: appId,
      },
      durationSeconds
    );
  });

  next();
});

//if (process.env.NODE_ENV !== 'test') {
//  app.use(rateLimit({
//    windowMs: 15 * 60 * 1000, // 15 minutes
//    limit: 10000, // Limit each IP to 100 requests per window
//    standardHeaders: true, // Return rate limit info in headers
//    legacyHeaders: false,
//  }));
//}

// Routes
app.post('/auth/register', authCtrl.register);
app.post('/auth/login', authCtrl.login);

// Recipe routes
app.post('/recipes', requireAuth, recipesCtrl.createRecipeHandler);
app.get('/recipes', requireAuth, recipesCtrl.listRecipesHandler);
app.get('/recipes/:id', requireAuth, recipesCtrl.getRecipeHandler);
app.put('/recipes/:id', requireAuth, recipesCtrl.updateRecipeHandler);
app.delete('/recipes/:id', requireAuth, recipesCtrl.deleteRecipeHandler);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error:', {
    error: err.message,
    stack: err.stack || 'No stack trace available',
    method: req.method,
    url: req.url,
    body: req.body,
  });
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
})

const port = Number(process.env.PORT ?? 4000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on ${port}`);
});

export default app