import { Recipe, RecipeIngredient, RecipeStep } from '../models/Recipe';
import { authFetch } from './ApiConfig';

export class RecipeService {
  static async getRecipes(search = '', category = ''): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'Tümü') params.append('category', category);
    const res = await authFetch(`/recipes?${params.toString()}`);
    if (!res.ok) throw new Error('Tarifler yüklenemedi');
    return res.json();
  }

  static async getRecipe(id: string): Promise<Recipe> {
    const res = await authFetch(`/recipes/${id}`);
    if (!res.ok) throw new Error('Tarif bulunamadı');
    return res.json();
  }

  static async createRecipe(data: {
    title: string;
    description?: string;
    ingredients: RecipeIngredient[];
    steps: RecipeStep[];
    category?: string;
    prep_time?: number;
    servings?: number;
  }): Promise<Recipe> {
    const res = await authFetch('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Tarif eklenemedi');
    return json;
  }

  static async deleteRecipe(id: string): Promise<void> {
    const res = await authFetch(`/recipes/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.detail || 'Silinemedi');
    }
  }

  static async addComment(recipeId: string, text: string): Promise<void> {
    const res = await authFetch(`/recipes/${recipeId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Yorum eklenemedi');
  }

  static async deleteComment(
    recipeId: string,
    commentId: string
  ): Promise<void> {
    const res = await authFetch(
      `/recipes/${recipeId}/comments/${commentId}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.detail || 'Silinemedi');
    }
  }
}
