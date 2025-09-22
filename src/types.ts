export interface IngredientInput {
  amount: string;
  name: string;
}

export interface InstructionInput {
  step_number: number;
  text: string;

}

export interface RecipeInput {
  title: string;
  ingredients: IngredientInput[];
  instructions: InstructionInput[];
}


