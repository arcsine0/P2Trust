import { FC } from "react";
import { View } from "react-native";
import { Chip, Text, Icon } from "react-native-paper";

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
                <View className="flex items-center justify-center h-full bg-green-500" style={{ width: `${positivePercentage}%` }}>
                    {dominantRating === "positive" && (
                        <Text variant="titleSmall" className="font-semibold text-white">{dominantPercentage}%</Text>
                    )}
                </View>
                <View className="flex items-center justify-center h-full bg-red-500" style={{ width: `${negativePercentage}%` }}>
                    {dominantRating === "negative" && (
                        <Text variant="titleSmall" className="font-semibold text-white">{dominantPercentage}%</Text>
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
                    <Text variant="bodyMedium" className="text-green-500 font-semibold">{positive}</Text>
                </View>
                <View className="flex flex-row space-x-1 items-center">
                    <Icon 
                        source={"thumb-down"}
                        size={15}
                        color={"#ef4444"}
                    />
                    <Text variant="bodyMedium" className="text-red-500 font-semibold">{negative}</Text>
                </View>
            </View>
        </View>
    )
}

export default RatingsBar;