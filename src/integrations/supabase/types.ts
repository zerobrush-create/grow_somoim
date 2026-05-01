export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ad_requests: {
        Row: {
          created_at: string
          id: number
          requester_id: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          created_at?: string
          id?: number
          requester_id: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          created_at?: string
          id?: number
          requester_id?: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ad_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          id: number
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          id?: number
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "admins_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          group_id: string
          id: number
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          group_id: string
          id?: number
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          group_id?: string
          id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          is_active: boolean
          link_url: string | null
          order: number
          requester_id: string | null
          title: string
          type: Database["public"]["Enums"]["banner_type"]
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          order?: number
          requester_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["banner_type"]
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          order?: number
          requester_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["banner_type"]
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      board_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: number
          post_id: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: number
          post_id: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: number
          post_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      board_post_likes: {
        Row: {
          post_id: number
          user_id: string
        }
        Insert: {
          post_id: number
          user_id: string
        }
        Update: {
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      board_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          group_id: string
          id: number
          image_url: string | null
          is_pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          group_id: string
          id?: number
          image_url?: string | null
          is_pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          group_id?: string
          id?: number
          image_url?: string | null
          is_pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      class_board_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: number
          post_id: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: number
          post_id: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: number
          post_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_board_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_board_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "class_board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      class_board_post_likes: {
        Row: {
          post_id: number
          user_id: string
        }
        Insert: {
          post_id: number
          user_id: string
        }
        Update: {
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_board_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "class_board_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_board_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      class_board_posts: {
        Row: {
          author_id: string
          class_id: number
          content: string
          created_at: string
          id: number
          image_url: string | null
          is_pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          class_id: number
          content: string
          created_at?: string
          id?: number
          image_url?: string | null
          is_pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          class_id?: number
          content?: string
          created_at?: string
          id?: number
          image_url?: string | null
          is_pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_board_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_board_posts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: number
          enrolled_at: string
          id: number
          user_id: string
        }
        Insert: {
          class_id: number
          enrolled_at?: string
          id?: number
          user_id: string
        }
        Update: {
          class_id?: number
          enrolled_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      class_messages: {
        Row: {
          class_id: number
          content: string
          created_at: string
          id: number
          sender_id: string
        }
        Insert: {
          class_id: number
          content: string
          created_at?: string
          id?: number
          sender_id: string
        }
        Update: {
          class_id?: number
          content?: string
          created_at?: string
          id?: number
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_messages_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      class_reviews: {
        Row: {
          author_id: string
          class_id: number
          content: string
          created_at: string
          id: number
          rating: number
        }
        Insert: {
          author_id: string
          class_id: number
          content: string
          created_at?: string
          id?: number
          rating: number
        }
        Update: {
          author_id?: string
          class_id?: number
          content?: string
          created_at?: string
          id?: number
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reviews_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          admin_note: string | null
          category: string | null
          created_at: string
          curriculum: string | null
          description: string | null
          fee_type: Database["public"]["Enums"]["fee_type"]
          id: number
          image_url: string | null
          instructor_id: string
          location: string | null
          max_students: number | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          price: string | null
          schedule: string | null
          status: Database["public"]["Enums"]["class_status"]
          title: string
        }
        Insert: {
          admin_note?: string | null
          category?: string | null
          created_at?: string
          curriculum?: string | null
          description?: string | null
          fee_type?: Database["public"]["Enums"]["fee_type"]
          id?: number
          image_url?: string | null
          instructor_id: string
          location?: string | null
          max_students?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price?: string | null
          schedule?: string | null
          status?: Database["public"]["Enums"]["class_status"]
          title: string
        }
        Update: {
          admin_note?: string | null
          category?: string | null
          created_at?: string
          curriculum?: string | null
          description?: string | null
          fee_type?: Database["public"]["Enums"]["fee_type"]
          id?: number
          image_url?: string | null
          instructor_id?: string
          location?: string | null
          max_students?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price?: string | null
          schedule?: string | null
          status?: Database["public"]["Enums"]["class_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: number
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          group_id: string
          id: string
          image_url: string | null
          location: string | null
          max_attendees: number | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          group_id: string
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          group_id?: string
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          gif_url: string | null
          group_id: string
          id: number
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          gif_url?: string | null
          group_id: string
          id?: number
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          gif_url?: string | null
          group_id?: string
          id?: number
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_photos: {
        Row: {
          created_at: string
          group_id: string
          id: number
          image_url: string
          uploader_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: number
          image_url: string
          uploader_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: number
          image_url?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_photos_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_photos_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_private: boolean
          location: string | null
          max_members: number | null
          name: string
          owner_id: string
          status: Database["public"]["Enums"]["group_status"]
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_private?: boolean
          location?: string | null
          max_members?: number | null
          name: string
          owner_id: string
          status?: Database["public"]["Enums"]["group_status"]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_private?: boolean
          location?: string | null
          max_members?: number | null
          name?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["group_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_applications: {
        Row: {
          applicant_id: string
          created_at: string
          id: number
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: number
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: number
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "instructor_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: number
          post_id: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: number
          post_id: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: number
          post_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "leader_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "leader_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: number
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: number
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "leader_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          group_id: string
          id: number
          joined_at: string | null
          role: Database["public"]["Enums"]["group_member_role"]
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: number
          joined_at?: string | null
          role?: Database["public"]["Enums"]["group_member_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: number
          joined_at?: string | null
          role?: Database["public"]["Enums"]["group_member_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      points: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: number
          type: Database["public"]["Enums"]["point_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: number
          type: Database["public"]["Enums"]["point_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: number
          type?: Database["public"]["Enums"]["point_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          interests: string[] | null
          location: string | null
          mbti: string | null
          name: string | null
          nickname: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id: string
          interests?: string[] | null
          location?: string | null
          mbti?: string | null
          name?: string | null
          nickname?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interests?: string[] | null
          location?: string | null
          mbti?: string | null
          name?: string | null
          nickname?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: number
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: number
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      store_transactions: {
        Row: {
          amount: number
          created_at: string
          id: number
          store_id: number
          token: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: number
          store_id: number
          token?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: number
          store_id?: number
          token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          created_at: string
          id: number
          is_active: boolean
          name: string
          owner_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          owner_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          agreed_terms_at: string | null
          bio: string | null
          birthdate: string | null
          created_at: string
          email: string
          first_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          last_name: string | null
          mbti: string | null
          nickname: string | null
          profile_image_url: string | null
          profile_location: string | null
          referral_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          show_groups: boolean | null
          updated_at: string
        }
        Insert: {
          agreed_terms_at?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          mbti?: string | null
          nickname?: string | null
          profile_image_url?: string | null
          profile_location?: string | null
          referral_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          show_groups?: boolean | null
          updated_at?: string
        }
        Update: {
          agreed_terms_at?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          mbti?: string | null
          nickname?: string | null
          profile_image_url?: string | null
          profile_location?: string | null
          referral_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          show_groups?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attend_status: "attending" | "not_attending" | "maybe"
      banner_type: "promo" | "app_intro"
      class_status: "pending" | "approved" | "rejected"
      event_status: "upcoming" | "ongoing" | "ended" | "cancelled"
      event_type: "regular" | "special"
      fee_type: "free" | "paid"
      group_member_role: "owner" | "admin" | "member"
      group_status: "active" | "archived"
      membership_status: "pending" | "approved" | "rejected" | "banned"
      payment_status: "unpaid" | "paid"
      point_type: "signup_bonus" | "referral" | "grant" | "use" | "donate"
      request_status: "pending" | "approved" | "rejected"
      user_role: "member" | "instructor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attend_status: ["attending", "not_attending", "maybe"],
      banner_type: ["promo", "app_intro"],
      class_status: ["pending", "approved", "rejected"],
      event_status: ["upcoming", "ongoing", "ended", "cancelled"],
      event_type: ["regular", "special"],
      fee_type: ["free", "paid"],
      group_member_role: ["owner", "admin", "member"],
      group_status: ["active", "archived"],
      membership_status: ["pending", "approved", "rejected", "banned"],
      payment_status: ["unpaid", "paid"],
      point_type: ["signup_bonus", "referral", "grant", "use", "donate"],
      request_status: ["pending", "approved", "rejected"],
      user_role: ["member", "instructor", "admin"],
    },
  },
} as const
