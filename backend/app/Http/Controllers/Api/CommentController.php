<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Comment;
use App\Models\CommentLike;

class CommentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'batch_id' => 'required|string|uuid',
            'guest_uuid' => 'required|string',
            'guest_name' => 'required|string',
            'guest_side' => 'required|in:groom,bride',
            'message' => 'required|string',
            'parent_id' => 'nullable|exists:comments,id'
        ]);

        $comment = Comment::create($request->all());

        if (empty($request->parent_id)) {
            $comment->load('replies');
        }
        $comment->is_liked = false;

        return response()->json([
            'success' => true,
            'data' => $comment
        ]);
    }

    public function toggleLike(Request $request, $id)
    {
        $request->validate([
            'guest_uuid' => 'required|string'
        ]);

        $comment = Comment::findOrFail($id);
        $guestUuid = $request->input('guest_uuid');

        $like = CommentLike::where('comment_id', $comment->id)
            ->where('guest_uuid', $guestUuid)
            ->first();

        if ($like) {
            $like->delete();
            $comment->decrement('likes_count');
            return response()->json(['success' => true, 'liked' => false, 'likes_count' => $comment->likes_count]);
        } else {
            CommentLike::create([
                'comment_id' => $comment->id,
                'guest_uuid' => $guestUuid
            ]);
            $comment->increment('likes_count');
            return response()->json(['success' => true, 'liked' => true, 'likes_count' => $comment->likes_count]);
        }
    }

    public function destroy(Request $request, $id)
    {
        $request->validate([
            'guest_uuid' => 'required|string'
        ]);

        $comment = Comment::findOrFail($id);
        $guestUuid = $request->input('guest_uuid');

        if ($comment->guest_uuid !== $guestUuid) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->json(['success' => true]);
    }
}
