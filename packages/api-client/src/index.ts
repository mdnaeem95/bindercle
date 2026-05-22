export { createFoilioClient, type FoilioClient, type CreateFoilioClientOptions } from './client';
export type { Database, Json } from './database.types';

// Convenience row-type aliases — saves consumers from drilling into Database['public']['Tables']
import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Binder = Database['public']['Tables']['binders']['Row'];
export type BinderInsert = Database['public']['Tables']['binders']['Insert'];
export type BinderUpdate = Database['public']['Tables']['binders']['Update'];

export type Card = Database['public']['Tables']['cards']['Row'];
export type CardInsert = Database['public']['Tables']['cards']['Insert'];
export type CardUpdate = Database['public']['Tables']['cards']['Update'];

export type CardPhoto = Database['public']['Tables']['card_photos']['Row'];
export type Follow = Database['public']['Tables']['follows']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Save = Database['public']['Tables']['saves']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];

export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
export type WishlistItem = Database['public']['Tables']['wishlist_items']['Row'];

export type PokemonTcgCard = Database['public']['Tables']['pokemon_tcg_cards']['Row'];
