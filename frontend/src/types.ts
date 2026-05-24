export interface Comment {
  id: number;
  batch_id: string;
  parent_id: number | null;
  guest_uuid: string;
  guest_name: string;
  guest_side: 'groom' | 'bride';
  message: string;
  likes_count: number;
  is_liked?: boolean;
  created_at: string;
  replies?: Comment[];
}

export interface Media {
  id: number;
  batch_id?: string;
  uploader_uuid: string;
  uploader_name: string;
  message: string | null;
  file_path: string | null;
  thumbnail_path: string | null;
  type: 'image' | 'video' | 'message';
  guest_side: 'groom' | 'bride';
  likes_count: number;
  is_liked?: boolean;
  created_at: string;
  comments?: Comment[];
}
