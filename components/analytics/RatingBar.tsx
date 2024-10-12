import { FC } from "react";
import { View } from "react-native";
import { Icon } from "react-native-paper";
import { Colors, Text } from "react-native-ui-lib"

interface RatingBarProps {
    positive: number;
    negative: number;
    total: number;
    height: number;
}

const RatingsBar: FC<RatingBarProps> = ({ positive, negative, total, height }) => {
    const positivePercentage = (positive / total) * 100;
    const negativePercentage = (negative / total) * 100;

    const dominantRating = positivePercentage >= negativePercentage ? "positive" : "negative";
    const dominantPercentage = Math.round(Math.max(positivePercentage, negativePercentage));

    return (
        <View className="flex flex-col w-full space-y-1">
            <View
                className="flex flex-row items-center w-full bg-slate-200 rounded-lg overflow-hidden"
                style={{ height: height }}
            >
                <View
                    className="flex items-center justify-center h-full"
                    style={{ backgroundColor: Colors.success400, width: `${positivePercentage}%` }}
                >
                    {dominantRating === "positive" && (
                        <Text bodySmall className="font-semibold text-white">{dominantPercentage}%</Text>
                    )}
                </View>
                <View
                    className="flex items-center justify-center h-full"
                    style={{ backgroundColor: Colors.error400, width: `${negativePercentage}%` }}
                >
                    {dominantRating === "negative" && (
                        <Text bodySmall className="font-semibold text-white">{dominantPercentage}%</Text>
                    )}
                </View>
            </View>
            <View className="flex flex-row justify-between">
                <View className="flex flex-row space-x-1 items-center">
                    <Icon
                        source={"thumb-up"}
                        size={15}
                        color={"#22c55e"}
                    />
                    <Text success400 bodySmall className="font-semibold">{positive}</Text>
                </View>
                <View className="flex flex-row space-x-1 items-center">
                    <Icon
                        source={"thumb-down"}
                        size={15}
                        color={"#ef4444"}
                    />
                    <Text error400 bodySmall className="font-semibold">{negative}</Text>
                </View>
            </View>
        </View>
    )
}

export default RatingsBar;