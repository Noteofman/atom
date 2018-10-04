<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Input;
use Carbon\Carbon;
use App\Http\Controllers\Controller;
use Cmgmyr\Messenger\Models\{Message, Participant};

use App\Models\Messages\Thread;
use App\Classes\Hasher;
use App\Http\Requests\Messages\{CreateThread, UpdateThread};
use App\Http\Resources\Messages\{Thread as ThreadResource};

class MessagesController extends Controller
{
    public function index(Request $request, string $type)
    {
        $currentUserId = Auth::user()->id;
        // All threads that user is participating in
        return ThreadResource::collection(Thread::forProfiles($currentUserId, $type)->get());
    }

    public function store(CreateThread $request, string $type)
    {
        $input = Input::all();
        $thread = Thread::create(['type' => $type]);

        if (Input::has('message')) {
            // Message
            $message = Message::create(
               [
                   'thread_id' => $thread->id,
                   'user_id'   => Auth::user()->id,
                   'body'      => $input['message'],
               ]
            );
        }

        // Sender
        Participant::create(
            [
                'thread_id' => $thread->id,
                'user_id'   => Auth::user()->id,
                'last_read' => new Carbon,
            ]
        );
        // Recipients
        $thread->addParticipant($input['recipients']);

        return new ThreadResource($thread);
    }

    /**
     * Adds new data to a current thread.
     *
     * @param $id
     * @return mixed
     */
    public function update(UpdateThread $request, string $type, string $id)
    {
        $input = Input::all();
        try {
            $thread = Thread::findOrFail(Thread::decodeObfuscatedId($id));
        } catch (ModelNotFoundException $e) {
            abort(404);
        }
        $thread->activateAllParticipants();

        // Message
        if (Input::has('message')) {
            Message::create(
                [
                    'thread_id' => $thread->id,
                    'user_id'   => Auth::id(),
                    'body'      => Input::get('message'),
                ]
            );
            // Add replier as a participant
            $participant = Participant::firstOrCreate(
                [
                    'thread_id' => $thread->id,
                    'user_id'   => Auth::user()->id,
                ]
            );
            $participant->last_read = new Carbon;
            $participant->save();
        }

        // Recipients
        if (Input::has('recipients')) {
            $thread->addParticipants(Input::get('recipients'));
        }

        return new ThreadResource($thread);
    }

    /**
     * Mark a specific thread as read.
     *
     * @param $id
     */
    public function read($id)
    {
        $thread = Thread::find($id);
        if (!$thread) {
            abort(404);
        }
        $thread->markAsRead(Auth::id());
    }

    /**
     * Get the number of unread threads.
     *
     * @return array
     */
    public function unread()
    {
        $count = Auth::user()->newMessagesCount();
        return ['msg_count' => $count];
    }
}
