import {pool } from '../db';
import { RecipeInput } from '../types';

export async function createRecipe(userId: string, data: RecipeInput): Promise<RecipeInput> {
  const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert recipe
      const r = await client.query(
        `INSERT INTO recipes (user_id, title)
         VALUES ($1, $2) RETURNING id, user_id, title, created_at`,
        [userId, data.title],
      );
      const recipe = r.rows[0];
      const recipeId = recipe.id;

      // Batch insert ingredients
      if (data.ingredients.length > 0) {
        const values = data.ingredients
          .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
          .join(', ');
        const params = data.ingredients.flatMap((ing) => [recipeId, ing.amount, ing.name]);
        await client.query(
          `INSERT INTO ingredients (recipe_id, amount, name) VALUES ${values}`,
          params,
        );
      }

      // Batch insert instructions
      if (data.instructions.length > 0) {
        const values = data.instructions
          .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
          .join(', ');
        const params = data.instructions.flatMap((ins) => [recipeId, ins.step_number, ins.text]);
        await client.query(
          `INSERT INTO instructions (recipe_id, step_number, text) VALUES ${values}`,
          params,
        );
      }

      await client.query('COMMIT');
      return { ...recipe, ingredients: data.ingredients, instructions: data.instructions };
    } catch (err: any) {
      await client.query('ROLLBACK');
      // Log specific constraint errors
      if (err.code === '23505') {
        // Unique violation (e.g., uniq_step_per_recipe)
        throw new Error(`Duplicate step_number in instructions: ${err.detail}`);
      } else if (err.code === '23503') {
        // Foreign key violation (e.g., invalid user_id)
        throw new Error(`Invalid user_id: ${err.detail}`);
      }
      throw err;
    } finally {
      client.release()
    }
  }

export async function getRecipeById(recipeId: number) {
  const client = await pool.connect();
  try {
    const r = await client.query(`SELECT id, user_id, title, created_at FROM recipes WHERE id = $1`, [recipeId]);
    const recipe = r.rows[0];
    if (!recipe) return null;

    const ingredients = (await client.query(`SELECT id, amount, name FROM ingredients WHERE recipe_id = $1`, [recipeId])).rows;
    const instructions = (await client.query(`SELECT id, step_number, text FROM instructions WHERE recipe_id = $1 ORDER BY step_number`, [recipeId])).rows;

    return { ...recipe, ingredients, instructions };
  } finally {
    client.release();
  }
}

export async function updateRecipe(userId: string, recipeId: number, data: RecipeInput) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // ensure ownership
    const check = await client.query(`SELECT user_id FROM recipes WHERE id = $1`, [recipeId]);
    if (check.rowCount === 0) throw { status: 404, message: 'recipe not found' };
    if (check.rows[0].user_id !== userId) throw { status: 403, message: 'forbidden' };

    await client.query(`UPDATE recipes SET title = $1 WHERE id = $2`, [data.title, recipeId]);


    // remove old ingredients/instructions and insert new ones
    await client.query(`DELETE FROM ingredients WHERE recipe_id = $1`, [recipeId]);
    await client.query(`DELETE FROM instructions WHERE recipe_id = $1`, [recipeId]);

    for (const ingredient of data.ingredients) {

      await client.query(
        `INSERT INTO ingredients (recipe_id, amount, name) VALUES ($1, $2, $3)`,

        [recipeId, ingredient.amount, ingredient.name]
      );
    }
    for (const ins of data.instructions) {
      await client.query(
        `INSERT INTO instructions (recipe_id, step_number, text) VALUES ($1, $2, $3)`,

        [recipeId, ins.step_number, ins.text]
      );
    }

    await client.query('COMMIT');
    return await getRecipeById(recipeId);

  } catch (err) {

    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteRecipe(userId: string, recipeId: number) {
  const client = await pool.connect();

  try {
    // check ownership
    const check = await client.query(`SELECT user_id FROM recipes WHERE id = $1`, [recipeId]);
    if (check.rowCount === 0) return { deleted: false };
    if (check.rows[0].user_id !== userId) throw { status: 403, message: 'forbidden' };

    await client.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
    return { deleted: true };

  } finally {
    client.release();
  }
}


export async function listRecipes(limit = 50, offset = 0) {
    const r = await pool.query(`SELECT id, user_id, title, created_at FROM recipes ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    return r.rows;
}

