import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as authCtrl from './auth/auth.controller';
import { requireAuth } from './auth/auth.middleware';
import * as recipesCtrl from './recipes/recipes.controller';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/auth/register', authCtrl.register);
app.post('/auth/login', authCtrl.login);

// Recipe routes

app.post('/recipes', requireAuth, recipesCtrl.createRecipeHandler);
app.get('/recipes', requireAuth, recipesCtrl.listRecipesHandler);

app.get('/recipes/:id', requireAuth, recipesCtrl.getRecipeHandler);
app.put('/recipes/:id', requireAuth, recipesCtrl.updateRecipeHandler);
app.delete('/recipes/:id', requireAuth, recipesCtrl.deleteRecipeHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});

