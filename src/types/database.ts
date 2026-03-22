export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          stripe_customer_id: string | null
          subscription_status: string
          charity_id: string | null
          contribution_percent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          stripe_customer_id?: string | null
          subscription_status?: string
          charity_id?: string | null
          contribution_percent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          stripe_customer_id?: string | null
          subscription_status?: string
          charity_id?: string | null
          contribution_percent?: number
          created_at?: string
          updated_at?: string
        }
      }
      charities: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          website_url: string | null
          total_raised: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          website_url?: string | null
          total_raised?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          website_url?: string | null
          total_raised?: number
          is_active?: boolean
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          plan_type: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          plan_type: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          plan_type?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
        }
      }
      scores: {
        Row: {
          id: string
          user_id: string
          score: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          date?: string
          created_at?: string
        }
      }
      draws: {
        Row: {
          id: string
          draw_date: string
          status: string
          prize_pool_3: number
          prize_pool_4: number
          prize_pool_5: number
          jackpot_rollover: number
          winning_numbers: number[]
          created_at: string
        }
        Insert: {
          id?: string
          draw_date: string
          status?: string
          prize_pool_3?: number
          prize_pool_4?: number
          prize_pool_5?: number
          jackpot_rollover?: number
          winning_numbers?: number[]
          created_at?: string
        }
        Update: {
          id?: string
          draw_date?: string
          status?: string
          prize_pool_3?: number
          prize_pool_4?: number
          prize_pool_5?: number
          jackpot_rollover?: number
          winning_numbers?: number[]
          created_at?: string
        }
      }
      winners: {
        Row: {
          id: string
          user_id: string
          draw_id: string
          match_tier: number
          prize_amount: number
          status: string
          proof_url: string | null
          payout_status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          draw_id: string
          match_tier: number
          prize_amount: number
          status?: string
          proof_url?: string | null
          payout_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          draw_id?: string
          match_tier?: number
          prize_amount?: number
          status?: string
          proof_url?: string | null
          payout_status?: string
          created_at?: string
        }
      }
      contributions: {
        Row: {
          id: string
          user_id: string
          draw_id: string
          charity_id: string
          amount: number
          contribution_percent: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          draw_id: string
          charity_id: string
          amount: number
          contribution_percent: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          draw_id?: string
          charity_id?: string
          amount?: number
          contribution_percent?: number
          created_at?: string
        }
      }
    }
    CompositeTypes: Record<string, never>
  }
}
