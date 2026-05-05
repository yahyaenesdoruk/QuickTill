import { Campaign } from '../models/Campaign';
import { authFetch } from './ApiConfig';

export class CampaignService {
  static async getCampaigns(): Promise<Campaign[]> {
    const res = await authFetch('/campaigns');
    if (!res.ok) throw new Error('Kampanyalar yüklenemedi');
    return res.json();
  }

  static async createCampaign(data: {
    title: string;
    description: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    start_date: string;
    end_date: string;
    target_emails: string[];
  }): Promise<Campaign> {
    const res = await authFetch('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Kampanya oluşturulamadı');
    return json;
  }

  static async toggleCampaign(id: string): Promise<{ is_active: boolean }> {
    const res = await authFetch(`/campaigns/${id}/toggle`, { method: 'PUT' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Hata');
    return json;
  }

  static async deleteCampaign(id: string): Promise<void> {
    const res = await authFetch(`/campaigns/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.detail || 'Silinemedi');
    }
  }
}
