import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { getGuestName, setGuestName, getGuestUuid, getGuestSide } from '../utils/storage';
import api from '../utils/api';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: () => void;
  onSubmitToBackground?: (files: File[], name: string, message: string) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUploadSuccess, onSubmitToBackground }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // ローカルストレージから名前の初期値を取得
    setName(getGuestName());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      // 2GB制限のバリデーション (2 * 1024 * 1024 * 1024 = 2147483648 bytes)
      const hasLargeFile = selectedFiles.some(f => f.size > 2147483648);
      if (hasLargeFile) {
        setError('ファイルサイズは1ファイルあたり2GB以下にしてください。');
        return;
      }
      setError(null);
      setFiles(selectedFiles);
      
      // メモリリークを防ぐため古いURLを解放
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // 新しいプレビューURLを作成（最初の1枚だけプレビューするか、単に枚数を表示するため使用しないが念のため1枚目を作成）
      if (selectedFiles[0].type.startsWith('image/') || selectedFiles[0].type.startsWith('video/')) {
        setPreviewUrls([URL.createObjectURL(selectedFiles[0])]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 && !message.trim()) {
      setError('ファイルを選択するか、メッセージを入力してください。');
      return;
    }
    if (!name.trim()) {
      setError('名前を入力してください。');
      return;
    }

    // 名前をローカルストレージに保存
    setGuestName(name.trim());
    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (onSubmitToBackground) {
        onSubmitToBackground(files, name.trim(), message.trim());
        return;
      }
      
      // 旧来のフォールバック動作（使われないはずだが残す）
      if (files.length === 0) {
        const formData = new FormData();
        formData.append('uploader_name', name.trim());
        formData.append('message', message.trim());
        formData.append('uploader_uuid', getGuestUuid());
        formData.append('guest_side', getGuestSide() || 'groom');
        formData.append('type', 'message');
        await api.post('/media', formData);
      } else {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('uploader_name', name.trim());
          formData.append('message', message.trim());
          formData.append('uploader_uuid', getGuestUuid());
          formData.append('guest_side', getGuestSide() || 'groom');
          formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');

          await api.post('/media', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent: any) => {
              if (progressEvent.total) {
                const fileProgress = progressEvent.loaded / progressEvent.total;
                const totalProgress = Math.round(((i + fileProgress) / files.length) * 100);
                setUploadProgress(totalProgress);
              }
            }
          });
        }
      }
      onUploadSuccess();
    } catch (err: any) {
      setError(err.message || 'アップロード中にエラーが発生しました。');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isUploading}
        >
          <X size={24} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Upload className="mr-2 text-tiffany" /> アップロード
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Selection Area */}
            <div>
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${files.length > 0 ? 'border-tiffany bg-tiffany/5' : 'border-gray-300 hover:border-tiffany-light hover:bg-gray-50'}
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input 
                  type="file" 
                  multiple
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                
                {files.length > 0 ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-16 h-16 bg-tiffany/20 text-tiffany rounded-full flex items-center justify-center mb-4">
                      <ImageIcon size={32} />
                    </div>
                    <p className="text-gray-800 font-bold text-lg">{files.length} 個のファイルを選択中</p>
                    <p className="text-sm text-gray-500 mt-1">タップして選び直す</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="flex gap-4 mb-4 text-gray-400">
                      <ImageIcon size={32} />
                      <Video size={32} />
                    </div>
                    <p className="text-gray-600 font-medium">タップして写真や動画を選択</p>
                    <p className="text-sm text-gray-400 mt-2">最大2GBまで</p>
                  </div>
                )}
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：山田 太郎"
                  required
                  disabled={isUploading}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tiffany/50 focus:border-tiffany transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メッセージ <span className="text-gray-400 text-xs ml-1">(任意)</span>
                </label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="お祝いのメッセージなどをご記入ください"
                  rows={3}
                  disabled={isUploading}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tiffany/50 focus:border-tiffany transition-colors resize-none"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button & Progress */}
            <div>
              <button
                type="submit"
                disabled={(!files.length && !message.trim()) || !name.trim() || isUploading}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-colors flex items-center justify-center
                  ${((!files.length && !message.trim()) || !name.trim() || isUploading) 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-tiffany hover:bg-tiffany-dark shadow-md'}
                `}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    アップロード中... {uploadProgress}%
                  </>
                ) : (
                  'アップロードする'
                )}
              </button>
              
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 overflow-hidden">
                  <div 
                    className="bg-tiffany h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
