export interface Campaign {
  id: string;
  title: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  target_emails: string[];
  is_active: boolean;
  created_at: string;
}
