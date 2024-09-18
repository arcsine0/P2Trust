import { Float } from "react-native/Libraries/Types/CodegenTypes";

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

export type Transaction = {
	id: string;
	created_at: Date;
	merchant: string;
	client: string;
	amount: number;
	platform: string;
	status: string;
	room_id: string;
}

export type Request = {
    created_at: Date;
    sender_id: string;
    sender_name: string;
}

export type Interaction =
| {
    timestamp: Date;
    type: "user";
    from: string;
    data: {
        eventType: "user_joined" | "user_left" | "user_disconnected" | "user_reconnected";
    };
}
| {
    timestamp: Date;
    type: "payment";
    from: string;
    data: {
        eventType: "payment_requested" | "payment_request_cancelled";
        amount: Float;
        currency: string;
        platform: string;
        merchantName: string;
        merchantNumber: string;
    };
}
| {
    timestamp: Date;
    type: "payment";
    from: string;
    data: {
        eventType: "payment_sent" | "payment_received";
    };
}
| {
    timestamp: Date;
    type: "message";
    from: string;
    data: {
        message: string;
    };
}
| {
    timestamp: Date;
    type: "submission";
    from: string;
    data: {
        submissionId: string;
    };
}
| {
    timestamp: Date;
    type: "transaction";
    from: string;
    data: {
        eventType: "transaction_started" | "transaction_completed" | "transaction_failed",
    };
};
