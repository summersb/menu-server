import { Request, Response } from 'express';
import * as model from './recipes.model';
import { AuthRequest } from '../auth/auth.middleware';

export async function createRecipeHandler(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const data = req.body;

  try {
    const recipe = await model.createRecipe(userId, data);
    res.status(201).json({ recipeId: recipe.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'could not create recipe' });
  }
}

export async function getRecipeHandler(req: Request, res: Response) {
  const id = req.params.id;
  try {
    const recipe = await model.getRecipeById(id);

    if (!recipe) return res.status(404).json({ error: 'not found' });
    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
}

export async function updateRecipeHandler(req: AuthRequest, res: Response) {

  const userId = req.userId!;
  const id = req.params.id;
  const data = req.body;
  try {
    const updated = await model.updateRecipe(userId, id, data);
    res.json(updated);
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
}

export async function deleteRecipeHandler(req: AuthRequest, res: Response) {
  const userId = req.userId!;

  const id = req.params.id;
  try {
    const result = await model.deleteRecipe(userId, id);
    if (!result.deleted) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
}

export async function listRecipesHandler(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const offset = Number(req.query.offset ?? 0);

  try {
    const list = await model.listRecipes(limit, offset);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
}

