export interface Media {
  id: number;
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
}
