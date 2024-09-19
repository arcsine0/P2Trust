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

export const formatTimeDifference = (timestamp: string, startTime: number, endTime: number) => {
    const eventTime = Date.parse(timestamp);
    const totalDuration = endTime - startTime;
    const timeElapsed = eventTime - startTime;

    const minutes = Math.floor((timeElapsed / (1000 * 60)) % 60);
    const seconds = Math.floor((timeElapsed / 1000) % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}