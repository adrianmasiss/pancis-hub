export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      article_references: {
        Row: {
          article_id: string;
          citation: string;
          created_at: string;
          doi: string | null;
          id: string;
          publication_year: number | null;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          article_id: string;
          citation: string;
          created_at?: string;
          doi?: string | null;
          id?: string;
          publication_year?: number | null;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          article_id?: string;
          citation?: string;
          created_at?: string;
          doi?: string | null;
          id?: string;
          publication_year?: number | null;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "article_references_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          body: string;
          category: string;
          created_at: string;
          deleted_at: string | null;
          evidence_level: string | null;
          id: string;
          key_points: string[];
          level: string | null;
          published_at: string | null;
          reading_minutes: number | null;
          reviewed_at: string | null;
          slug: string;
          status: string;
          summary: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          category: string;
          created_at?: string;
          deleted_at?: string | null;
          evidence_level?: string | null;
          id?: string;
          key_points?: string[];
          level?: string | null;
          published_at?: string | null;
          reading_minutes?: number | null;
          reviewed_at?: string | null;
          slug: string;
          status?: string;
          summary: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          category?: string;
          created_at?: string;
          deleted_at?: string | null;
          evidence_level?: string | null;
          id?: string;
          key_points?: string[];
          level?: string | null;
          published_at?: string | null;
          reading_minutes?: number | null;
          reviewed_at?: string | null;
          slug?: string;
          status?: string;
          summary?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          details: Json | null;
          entity: string | null;
          entity_id: string | null;
          id: string;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json | null;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json | null;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      body_measurements: {
        Row: {
          arm_cm: number | null;
          attachment_storage_path: string | null;
          body_fat_percentage: number | null;
          body_water_percentage: number | null;
          chest_cm: number | null;
          created_at: string;
          hip_cm: number | null;
          id: string;
          measured_at: string;
          notes: string | null;
          skeletal_muscle_kg: number | null;
          source: string;
          thigh_cm: number | null;
          updated_at: string;
          user_id: string;
          visceral_fat_level: number | null;
          waist_cm: number | null;
          weight_kg: number | null;
        };
        Insert: {
          arm_cm?: number | null;
          attachment_storage_path?: string | null;
          body_fat_percentage?: number | null;
          body_water_percentage?: number | null;
          chest_cm?: number | null;
          created_at?: string;
          hip_cm?: number | null;
          id?: string;
          measured_at?: string;
          notes?: string | null;
          skeletal_muscle_kg?: number | null;
          source?: string;
          thigh_cm?: number | null;
          updated_at?: string;
          user_id: string;
          visceral_fat_level?: number | null;
          waist_cm?: number | null;
          weight_kg?: number | null;
        };
        Update: {
          arm_cm?: number | null;
          attachment_storage_path?: string | null;
          body_fat_percentage?: number | null;
          body_water_percentage?: number | null;
          chest_cm?: number | null;
          created_at?: string;
          hip_cm?: number | null;
          id?: string;
          measured_at?: string;
          notes?: string | null;
          skeletal_muscle_kg?: number | null;
          source?: string;
          thigh_cm?: number | null;
          updated_at?: string;
          user_id?: string;
          visceral_fat_level?: number | null;
          waist_cm?: number | null;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      daily_checkins: {
        Row: {
          created_at: string;
          date: string;
          energy: number | null;
          hunger: number | null;
          id: string;
          mood: number | null;
          notes: string | null;
          nutrition_adherence: number | null;
          sleep_hours: number | null;
          sleep_quality: number | null;
          soreness: number | null;
          stress: number | null;
          training_completed: boolean | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date?: string;
          energy?: number | null;
          hunger?: number | null;
          id?: string;
          mood?: number | null;
          notes?: string | null;
          nutrition_adherence?: number | null;
          sleep_hours?: number | null;
          sleep_quality?: number | null;
          soreness?: number | null;
          stress?: number | null;
          training_completed?: boolean | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          energy?: number | null;
          hunger?: number | null;
          id?: string;
          mood?: number | null;
          notes?: string | null;
          nutrition_adherence?: number | null;
          sleep_hours?: number | null;
          sleep_quality?: number | null;
          soreness?: number | null;
          stress?: number | null;
          training_completed?: boolean | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      dietary_preferences: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          preference_type: string;
          severity: string | null;
          updated_at: string;
          user_id: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          preference_type: string;
          severity?: string | null;
          updated_at?: string;
          user_id: string;
          value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          preference_type?: string;
          severity?: string | null;
          updated_at?: string;
          user_id?: string;
          value?: string;
        };
        Relationships: [];
      };
      exercise_catalog: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          difficulty: string | null;
          equipment: string | null;
          id: string;
          instructions: string | null;
          movement_pattern: string | null;
          name: string;
          primary_muscle: string;
          secondary_muscles: string[];
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          difficulty?: string | null;
          equipment?: string | null;
          id?: string;
          instructions?: string | null;
          movement_pattern?: string | null;
          name: string;
          primary_muscle: string;
          secondary_muscles?: string[];
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          difficulty?: string | null;
          equipment?: string | null;
          id?: string;
          instructions?: string | null;
          movement_pattern?: string | null;
          name?: string;
          primary_muscle?: string;
          secondary_muscles?: string[];
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          item_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          item_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          item_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      food_portions: {
        Row: {
          created_at: string;
          food_id: string;
          grams: number;
          household_measure: string | null;
          id: string;
          label: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          grams: number;
          household_measure?: string | null;
          id?: string;
          label: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          grams?: number;
          household_measure?: string | null;
          id?: string;
          label?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_portions_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
        ];
      };
      foods: {
        Row: {
          brand: string | null;
          calories: number;
          carbohydrate_g: number;
          cooked_state: string | null;
          created_at: string;
          deleted_at: string | null;
          fat_g: number;
          fiber_g: number;
          food_group: string;
          grams_per_serving: number;
          id: string;
          name: string;
          owner_user_id: string | null;
          protein_g: number;
          serving_amount: number;
          serving_unit: string;
          source: string | null;
          updated_at: string;
          verified: boolean;
        };
        Insert: {
          brand?: string | null;
          calories: number;
          carbohydrate_g: number;
          cooked_state?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          fat_g: number;
          fiber_g?: number;
          food_group: string;
          grams_per_serving?: number;
          id?: string;
          name: string;
          owner_user_id?: string | null;
          protein_g: number;
          serving_amount?: number;
          serving_unit?: string;
          source?: string | null;
          updated_at?: string;
          verified?: boolean;
        };
        Update: {
          brand?: string | null;
          calories?: number;
          carbohydrate_g?: number;
          cooked_state?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          fat_g?: number;
          fiber_g?: number;
          food_group?: string;
          grams_per_serving?: number;
          id?: string;
          name?: string;
          owner_user_id?: string | null;
          protein_g?: number;
          serving_amount?: number;
          serving_unit?: string;
          source?: string | null;
          updated_at?: string;
          verified?: boolean;
        };
        Relationships: [];
      };
      meal_items: {
        Row: {
          calories_snapshot: number;
          carbohydrate_snapshot: number;
          created_at: string;
          fat_snapshot: number;
          fiber_snapshot: number;
          food_id: string;
          id: string;
          meal_id: string;
          protein_snapshot: number;
          quantity_g: number;
          updated_at: string;
        };
        Insert: {
          calories_snapshot: number;
          carbohydrate_snapshot: number;
          created_at?: string;
          fat_snapshot: number;
          fiber_snapshot?: number;
          food_id: string;
          id?: string;
          meal_id: string;
          protein_snapshot: number;
          quantity_g: number;
          updated_at?: string;
        };
        Update: {
          calories_snapshot?: number;
          carbohydrate_snapshot?: number;
          created_at?: string;
          fat_snapshot?: number;
          fiber_snapshot?: number;
          food_id?: string;
          id?: string;
          meal_id?: string;
          protein_snapshot?: number;
          quantity_g?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_items_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_items_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
        ];
      };
      meals: {
        Row: {
          created_at: string;
          date: string;
          deleted_at: string | null;
          id: string;
          meal_type: string;
          name: string | null;
          notes: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          deleted_at?: string | null;
          id?: string;
          meal_type: string;
          name?: string | null;
          notes?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          deleted_at?: string | null;
          id?: string;
          meal_type?: string;
          name?: string | null;
          notes?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      nutrition_targets: {
        Row: {
          calories: number;
          carbohydrate_g: number;
          created_at: string;
          effective_from: string;
          fat_g: number;
          fiber_g: number;
          id: string;
          protein_g: number;
          source: string;
          status: string;
          updated_at: string;
          user_id: string;
          water_ml: number;
        };
        Insert: {
          calories: number;
          carbohydrate_g: number;
          created_at?: string;
          effective_from?: string;
          fat_g: number;
          fiber_g: number;
          id?: string;
          protein_g: number;
          source: string;
          status?: string;
          updated_at?: string;
          user_id: string;
          water_ml: number;
        };
        Update: {
          calories?: number;
          carbohydrate_g?: number;
          created_at?: string;
          effective_from?: string;
          fat_g?: number;
          fiber_g?: number;
          id?: string;
          protein_g?: number;
          source?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
          water_ml?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          activity_level: string | null;
          biological_sex: string | null;
          birth_date: string | null;
          created_at: string;
          daily_steps: number | null;
          display_name: string | null;
          experience_level: string | null;
          height_cm: number | null;
          id: string;
          locale: string;
          meals_per_day: number | null;
          onboarding_completed_at: string | null;
          primary_goal: string | null;
          theme: string;
          timezone: string;
          training_days_per_week: number | null;
          training_type: string | null;
          unit_system: string;
          updated_at: string;
          usual_training_time: string | null;
        };
        Insert: {
          activity_level?: string | null;
          biological_sex?: string | null;
          birth_date?: string | null;
          created_at?: string;
          daily_steps?: number | null;
          display_name?: string | null;
          experience_level?: string | null;
          height_cm?: number | null;
          id: string;
          locale?: string;
          meals_per_day?: number | null;
          onboarding_completed_at?: string | null;
          primary_goal?: string | null;
          theme?: string;
          timezone?: string;
          training_days_per_week?: number | null;
          training_type?: string | null;
          unit_system?: string;
          updated_at?: string;
          usual_training_time?: string | null;
        };
        Update: {
          activity_level?: string | null;
          biological_sex?: string | null;
          birth_date?: string | null;
          created_at?: string;
          daily_steps?: number | null;
          display_name?: string | null;
          experience_level?: string | null;
          height_cm?: number | null;
          id?: string;
          locale?: string;
          meals_per_day?: number | null;
          onboarding_completed_at?: string | null;
          primary_goal?: string | null;
          theme?: string;
          timezone?: string;
          training_days_per_week?: number | null;
          training_type?: string | null;
          unit_system?: string;
          updated_at?: string;
          usual_training_time?: string | null;
        };
        Relationships: [];
      };
      progress_photos: {
        Row: {
          captured_at: string;
          created_at: string;
          id: string;
          notes: string | null;
          private_storage_path: string;
          updated_at: string;
          user_id: string;
          view_type: string;
        };
        Insert: {
          captured_at?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          private_storage_path: string;
          updated_at?: string;
          user_id: string;
          view_type: string;
        };
        Update: {
          captured_at?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          private_storage_path?: string;
          updated_at?: string;
          user_id?: string;
          view_type?: string;
        };
        Relationships: [];
      };
      recipe_ingredients: {
        Row: {
          created_at: string;
          food_id: string;
          id: string;
          quantity_g: number;
          recipe_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          id?: string;
          quantity_g: number;
          recipe_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          id?: string;
          quantity_g?: number;
          recipe_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      recipes: {
        Row: {
          allergens: string[];
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          difficulty: string | null;
          id: string;
          image_storage_path: string | null;
          instructions: string | null;
          name: string;
          owner_user_id: string;
          preparation_minutes: number | null;
          servings: number;
          tags: string[];
          updated_at: string;
          visibility: string;
        };
        Insert: {
          allergens?: string[];
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          difficulty?: string | null;
          id?: string;
          image_storage_path?: string | null;
          instructions?: string | null;
          name: string;
          owner_user_id: string;
          preparation_minutes?: number | null;
          servings?: number;
          tags?: string[];
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          allergens?: string[];
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          difficulty?: string | null;
          id?: string;
          image_storage_path?: string | null;
          instructions?: string | null;
          name?: string;
          owner_user_id?: string;
          preparation_minutes?: number | null;
          servings?: number;
          tags?: string[];
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          category: string;
          confidence: string;
          created_at: string;
          evidence_context: Json | null;
          explanation: string;
          id: string;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category: string;
          confidence: string;
          created_at?: string;
          evidence_context?: Json | null;
          explanation: string;
          id?: string;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          confidence?: string;
          created_at?: string;
          evidence_context?: Json | null;
          explanation?: string;
          id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_plan_days: {
        Row: {
          created_at: string;
          day_index: number;
          id: string;
          name: string | null;
          updated_at: string;
          workout_plan_id: string;
        };
        Insert: {
          created_at?: string;
          day_index: number;
          id?: string;
          name?: string | null;
          updated_at?: string;
          workout_plan_id: string;
        };
        Update: {
          created_at?: string;
          day_index?: number;
          id?: string;
          name?: string | null;
          updated_at?: string;
          workout_plan_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_plan_days_workout_plan_id_fkey";
            columns: ["workout_plan_id"];
            isOneToOne: false;
            referencedRelation: "workout_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_plan_exercises: {
        Row: {
          created_at: string;
          exercise_id: string;
          id: string;
          notes: string | null;
          position: number;
          rest_seconds: number | null;
          sets: number | null;
          target_reps_max: number | null;
          target_reps_min: number | null;
          target_rir: number | null;
          target_rpe: number | null;
          tempo: string | null;
          updated_at: string;
          workout_plan_day_id: string;
        };
        Insert: {
          created_at?: string;
          exercise_id: string;
          id?: string;
          notes?: string | null;
          position: number;
          rest_seconds?: number | null;
          sets?: number | null;
          target_reps_max?: number | null;
          target_reps_min?: number | null;
          target_rir?: number | null;
          target_rpe?: number | null;
          tempo?: string | null;
          updated_at?: string;
          workout_plan_day_id: string;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          id?: string;
          notes?: string | null;
          position?: number;
          rest_seconds?: number | null;
          sets?: number | null;
          target_reps_max?: number | null;
          target_reps_min?: number | null;
          target_rir?: number | null;
          target_rpe?: number | null;
          tempo?: string | null;
          updated_at?: string;
          workout_plan_day_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_plan_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercise_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_plan_exercises_workout_plan_day_id_fkey";
            columns: ["workout_plan_day_id"];
            isOneToOne: false;
            referencedRelation: "workout_plan_days";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_plans: {
        Row: {
          active: boolean;
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          notes: string | null;
          objective: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          objective?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          objective?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          started_at: string;
          updated_at: string;
          user_id: string;
          workout_plan_day_id: string | null;
          workout_plan_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          started_at?: string;
          updated_at?: string;
          user_id: string;
          workout_plan_day_id?: string | null;
          workout_plan_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          started_at?: string;
          updated_at?: string;
          user_id?: string;
          workout_plan_day_id?: string | null;
          workout_plan_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_day_id_fkey";
            columns: ["workout_plan_day_id"];
            isOneToOne: false;
            referencedRelation: "workout_plan_days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey";
            columns: ["workout_plan_id"];
            isOneToOne: false;
            referencedRelation: "workout_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_sets: {
        Row: {
          created_at: string;
          exercise_id: string;
          id: string;
          is_warmup: boolean;
          notes: string | null;
          repetitions: number | null;
          rest_seconds: number | null;
          rir: number | null;
          rpe: number | null;
          session_id: string;
          set_number: number;
          tempo: string | null;
          updated_at: string;
          weight_kg: number | null;
        };
        Insert: {
          created_at?: string;
          exercise_id: string;
          id?: string;
          is_warmup?: boolean;
          notes?: string | null;
          repetitions?: number | null;
          rest_seconds?: number | null;
          rir?: number | null;
          rpe?: number | null;
          session_id: string;
          set_number: number;
          tempo?: string | null;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          id?: string;
          is_warmup?: boolean;
          notes?: string | null;
          repetitions?: number | null;
          rest_seconds?: number | null;
          rir?: number | null;
          rpe?: number | null;
          session_id?: string;
          set_number?: number;
          tempo?: string | null;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercise_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
