import {pool, withTransaction} from '../db';
import {RecipeInput} from '../types';

export async function createRecipe(userId: string, data: RecipeInput): Promise<RecipeInput> {
  return withTransaction(async (client) => {

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
        `INSERT INTO ingredients (recipe_id, amount, name)
         VALUES ${values}`,
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
        `INSERT INTO instructions (recipe_id, step_number, text)
         VALUES ${values}`,
        params,
      );
    }

    return {...recipe, ingredients: data.ingredients, instructions: data.instructions};
  })
}

export async function getRecipeById(recipeId: number) {
  const r = await pool.query(`SELECT id, user_id, title, created_at
                              FROM recipes
                              WHERE id = $1`, [recipeId]);
  const recipe = r.rows[0];
  if (!recipe) {
    return null
  }

  const ingredients = (await pool.query(`SELECT id, amount, name
                                         FROM ingredients
                                         WHERE recipe_id = $1`, [recipeId])).rows;
  const instructions = (await pool.query(`SELECT id, step_number, text
                                          FROM instructions
                                          WHERE recipe_id = $1
                                          ORDER BY step_number`, [recipeId])).rows;

  return {...recipe, ingredients, instructions};
}

export async function updateRecipe(userId: string, recipeId: number, data: RecipeInput) {
  return withTransaction(async (client) => {
    // ensure ownership
    const check = await client.query(`SELECT user_id
                                      FROM recipes
                                      WHERE id = $1`, [recipeId]);
    if (check.rowCount === 0) throw {status: 404, message: 'recipe not found'};
    if (check.rows[0].user_id !== userId) throw {status: 403, message: 'forbidden'};

    await client.query(`UPDATE recipes SET title = $1 WHERE id = $2`, [data.title, recipeId])

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

    return await getRecipeById(recipeId);
  })
}

export async function deleteRecipe(userId: string, recipeId: number) {

  // check ownership
  const check = await pool.query(`SELECT user_id FROM recipes WHERE id = $1`, [recipeId]);
  if (check.rowCount === 0) return {deleted: false};
  if (check.rows[0].user_id !== userId) throw {status: 403, message: 'forbidden'};

  await pool.query(`DELETE
                    FROM recipes
                    WHERE id = $1`, [recipeId]);
  return {deleted: true};
}


export async function listRecipes(limit = 50, offset = 0) {
  const r = await pool.query(`SELECT id, user_id, title, created_at
                              FROM recipes
                              ORDER BY created_at DESC LIMIT $1
                              OFFSET $2`, [limit, offset]);
  return r.rows;
}

