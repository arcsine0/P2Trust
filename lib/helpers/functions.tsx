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