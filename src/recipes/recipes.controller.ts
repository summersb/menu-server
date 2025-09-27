import { Request, Response } from 'express';
import * as model from './recipes.model';
import { AuthRequest } from '../auth/auth.middleware';

export async function createRecipeHandler(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const data = req.body;

  try {
    const recipe = await model.createRecipe(userId, data);
    res.status(201).json({recipeId: recipe.id});
  }catch(err:any) {
    console.error('Error in createRecipeHandler:', {
      error: err.message,
      stack: err.stack,
      userId,
      data,
    });
    res.status(err.status || 500).json({ error: err.message || 'Could not create recipe' });
  }
}

export async function getRecipeHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (isNaN(Number(id))) {
      res.status(400).json({error: 'Invalid id'});
      return
    }
    const recipe = await model.getRecipeById(Number(id));
    if (!recipe) return res.status(404).json({error: 'not found'});
    res.json(recipe);
  }catch(err:any) {
    console.error('Error in getRecipeHandler:', err);
    res.status(err.status || 500).json({error: err.message || 'Could not get recipe' });
  }
}

export async function updateRecipeHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);
    const data = req.body;
    const updated = await model.updateRecipe(userId, id, data);
    res.json(updated);
  }catch(err:any) {
    console.error('Error in updateRecipeHandler:', err);
    res.status(err.status || 500).json({error: err.message || 'Could not update recipe' });
  }
}

export async function deleteRecipeHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    const id = Number(req.params.id)
    const result = await model.deleteRecipe(userId, id);
    if (!result.deleted) return res.status(404).json({error: 'not found'});
    res.json({success: true});
  }catch (err:any) {
    console.error('Error in deleteRecipeHandler:', err);
    res.status(err.status || 500).json({error: err.message || 'Could not delete recipe' });
  }
}

export async function listRecipesHandler(req: AuthRequest, res: Response) {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const offset = Number(req.query.offset ?? 0);

    const list = await model.listRecipes(limit, offset);
    res.json(list);
  }catch(err:any) {
    console.error('Error in listRecipesHandler:', err);
    res.status(err.status || 500).json({error: err.message || 'Could not list recipes'});
  }
}

