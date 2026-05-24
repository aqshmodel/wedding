<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMediaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // 認証なしのパブリックアプリなのでtrue
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'uploader_name' => 'required|string|max:255',
            'message' => 'nullable|string',
            'uploader_uuid' => 'required|string',
            'guest_side' => 'required|in:groom,bride',
            'type' => 'required|in:image,video,message',
            'batch_id' => 'nullable|string|uuid',
            'file' => 'nullable|file|mimes:jpeg,png,jpg,webp,heic,heif,mp4,mov,qt,avi,m4v,3gp,3g2,webm,mkv,mp3,aac,flac,alac,m4a',
            'thumbnail_file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp',
        ];
    }
    
    /**
     * バリデーション後の追加チェック
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->type === 'message' && empty($this->message)) {
                $validator->errors()->add('message', 'メッセージを入力してください。');
            }
        });
    }
}
