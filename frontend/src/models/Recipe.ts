export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface RecipeStep {
  order: number;
  description: string;
}

export interface RecipeComment {
  id: string;
  text: string;
  author_id: string;
  author_name: string;
  author_username: string;
  created_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  category: string;
  prep_time?: number;
  servings?: number;
  author_id: string;
  author_name: string;
  author_username: string;
  comments: RecipeComment[];
  comment_count: number;
  created_at: string;
}
