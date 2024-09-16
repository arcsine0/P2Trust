export type UserData = {
	id: string;
	username: string;
	push_token: string;
	[key: string]: any;
}

export type RoomData = {
    id: string;
    [key: string]: any;
}

export type Request = {
    id: string;
    created_at: Date;
    status: string;
    sender_id: string;
    sender_name: string;
    receiver_id: string;
    sender_push_token: string;
}