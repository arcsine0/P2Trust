import { supabase } from "@/supabase/config";
import { Colors } from "react-native-ui-lib";

export const getInitials = (name: string) => {
    if (name) {
        const words = name.trim().split(" ");
        let initials = "";

        for (let i = 0; i < Math.min(words.length, 2); i++) {
            if (words[i].length > 0) {
                initials += words[i][0].toUpperCase();
            }
        }

        return initials;
    } else {
        return "N/A"
    }
}

export const capitalizeName = (str: string): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const formatTimeDifference = (timestamp: string, startTime: number, endTime: number) => {
    const eventTime = Date.parse(timestamp);
    const totalDuration = endTime - startTime;
    const timeElapsed = eventTime - startTime;

    const minutes = Math.floor((timeElapsed / (1000 * 60)) % 60);
    const seconds = Math.floor((timeElapsed / 1000) % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const formatISODate = (iso: string) => {
    const formattedDate = new Date(iso).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    return formattedDate;
}

export const getBlobFromSupabase = async (path: string) => {
    const { data, error } = await supabase.storage
        .from("receipts")
        .download(path)

    if (!error && data) {
        return data;
    }
}

export const interpolateColor = (color1: string, color2: string, factor: number) => {
    const c1 = Colors[color1].replace("#", "");
    const c2 = Colors[color2].replace("#", "");
    const f = Math.max(0, Math.min(1, factor));
    const result = (
        (parseInt(c1.substring(0, 2), 16) * (1 - f) + parseInt(c2.substring(0, 2), 16) * f) << 16 |
        (parseInt(c1.substring(2, 4), 16) * (1 - f) + parseInt(c2.substring(2, 4), 16) * f) << 8 |
        (parseInt(c1.substring(4, 6), 16) * (1 - f) + parseInt(c2.substring(4, 6), 16) * f)
    ).toString(16).padStart(6, "0");
    return `#${result}`;
};

export const sendVerification = async (phone: string) => {
    try {
        const response = await fetch(`https://verify.twilio.com/v2/Services/VA48473a827b30a0eab12db376bba0bb13/Verifications/To=${phone}/Channel=sms`, {
            method: "POST",
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

export const checkVerification = async (phone: string, code: string) => {
    try {
        const response = await fetch(`https://verify.twilio.com/v2/Services/VA48473a827b30a0eab12db376bba0bb13/VerificationCheck/To=${phone}/Code=${code}`, {
            method: "POST",
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

export const parseDate = (dateString: string): Date | null => {
    const months: { [key: string]: number } = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const dateRegex = /(\w{3})\s(\d{1,2}),\s(\d{4})\s(\d{1,2}):(\d{2})\s([APap][Mm])/;
    const match = dateString.match(dateRegex);

    if (match) {
        const month = months[match[1]];
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);
        let hour = parseInt(match[4]);
        const minute = parseInt(match[5]);
        const ampm = match[6].toUpperCase();

        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;

        return new Date(year, month, day, hour, minute);
    }

    return null; 
}