import { router } from "expo-router";

import { useState } from "react";
import { ScrollView } from "react-native";

import { Chip } from "react-native-paper";
import { Colors, View, Text, Card, Picker, PickerModes, Avatar, Marquee, MarqueeDirections } from "react-native-ui-lib";

import { PieChart } from "react-native-gifted-charts";

import { useMerchantData } from "@/lib/context/MerchantContext";
import { RequestRoles } from "@/lib/helpers/collections";
import { interpolateColor, getInitials } from "@/lib/helpers/functions";

import { MaterialCommunityIcons } from "@expo/vector-icons";

export function MerchantRatings() {
    const [ratingsRole, setRatingsRole] = useState<string | undefined>("Seller");

    const { ratings } = useMerchantData();

    const renderDot = (size: number, color: string) => (
        <View
            style={{
                height: size,
                width: size,
                borderRadius: 10,
                backgroundColor: color,
            }}

        />
    )

    return (
        <ScrollView className="w-full">
            <View className="flex flex-col px-4 py-4 w-full h-full space-y-2 items-start justify-start">
                <Card
                    style={{ backgroundColor: Colors.bgDefault }}
                    className="flex flex-col w-full p-4 space-y-2"
                    elevation={10}
                >
                    <Text body className="font-bold">Select Ratings Type</Text>
                    <View className="w-full" style={{ backgroundColor: Colors.gray100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 13, elevation: 2 }}>
                        <Picker
                            value={ratingsRole}
                            mode={PickerModes.SINGLE}
                            useDialog={true}
                            customPickerProps={{ migrateDialog: true }}
                            trailingAccessory={<MaterialCommunityIcons name="chevron-down" size={20} color={Colors.gray900} />}
                            onChange={value => setRatingsRole(value?.toString())}
                        >
                            {RequestRoles.map((pl, i) => (
                                <Picker.Item key={i} label={pl.label} value={pl.value} />
                            ))}
                        </Picker>
                    </View>
                </Card>
                {ratings && (
                    <View className="flex flex-col w-full space-y-2">
                        <Card
                            style={{ backgroundColor: Colors.bgDefault }}
                            className="flex flex-col w-full p-4 space-y-2"
                            elevation={10}
                        >
                            <Text bodyLarge className="font-bold">{ratingsRole} Ratings Ratio</Text>
                            {ratings.client && ratings.merchant && (ratingsRole === "Seller" ? ratings.merchant : ratings.client).total > 0 ?
                                <View className="flex flex-row w-full space-x-4 items-center justify-center">
                                    <PieChart
                                        data={[
                                            { value: (ratingsRole === "Seller" ? ratings.merchant : ratings.client).positive, color: Colors.success400 },
                                            { value: (ratingsRole === "Seller" ? ratings.merchant : ratings.client).negative, color: Colors.error400 },
                                        ]}
                                        donut
                                        sectionAutoFocus
                                        radius={70}
                                        innerRadius={45}
                                        innerCircleColor={Colors.bgDefault}
                                        centerLabelComponent={() => (
                                            <View className="flex flex-col items-center justify-center">
                                                <Text h2 className="font-bold">{(ratingsRole === "Seller" ? ratings.merchant : ratings.client)?.total || 0}</Text>
                                                <Text caption className="font-bold">Total</Text>
                                            </View>
                                        )}
                                    />
                                    <View className="flex flex-col flex-1 space-y-2">
                                        <View className="flex flex-row space-x-2 items-center">
                                            {renderDot(10, Colors.success400)}
                                            <Text bodySmall>Upvote</Text>
                                        </View>
                                        <View className="flex flex-row space-x-2 items-center">
                                            {renderDot(10, Colors.error400)}
                                            <Text bodySmall>Downvote</Text>
                                        </View>
                                    </View>
                                </View>
                                :
                                <View
                                    className="flex w-full px-2 py-4 space-y-1 items-center justify-center"
                                    style={{ backgroundColor: Colors.gray200 }}
                                >
                                    <Text bodyLarge black className="font-semibold">No Ratings Yet</Text>
                                    <Text bodySmall black className="text-center">This user has not transacted with any {ratingsRole === "Seller" ? "buyers" : "sellers"} yet.</Text>
                                </View>
                            }
                        </Card>
                        <Card
                            style={{ backgroundColor: Colors.bgDefault }}
                            className="flex flex-col w-full p-4 space-y-2"
                            elevation={10}
                        >
                            <Text bodyLarge className="font-bold">Top Positive Tags</Text>
                            {ratings.client && ratings.merchant && (ratingsRole === "Seller" ? ratings.merchant : ratings.client).tags.length > 0 ?
                                <View className="flex flex-row w-full space-x-4 items-center justify-center">
                                    <PieChart
                                        data={(ratingsRole === "Seller" ? ratings.merchant : ratings.client).tags.filter(tag => tag.type === "Positive").sort(
                                            (a, b) => b.count - a.count
                                        ).slice(0, 4).map((tag, index) => ({
                                            value: tag.count,
                                            color: interpolateColor("success700", "success100", index / ((ratingsRole === "Seller" ? ratings.merchant : ratings.client)?.tags.length || 7)),
                                            text: tag.count.toString(),
                                        }))}
                                        focusOnPress
                                        radius={70}
                                    />
                                    <View className="flex flex-col flex-1 space-y-2">
                                        {(ratingsRole === "Seller" ? ratings.merchant : ratings.client).tags.filter(tag => tag.type === "Positive").sort(
                                            (a, b) => b.count - a.count
                                        ).slice(0, 4).map((tag, index) => (
                                            <View className="flex flex-row space-x-2 items-center">
                                                {renderDot(10, interpolateColor("success700", "success100", index / ((ratingsRole === "Seller" ? ratings.merchant : ratings.client)?.tags.length || 7)))}
                                                <View className="flex flex-col">
                                                    <Text bodySmall gray900>{tag.tag}</Text>
                                                    <Text caption gray400>Count: {tag.count}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                :
                                <View
                                    className="flex w-full px-2 py-4 space-y-1 items-center justify-center"
                                    style={{ backgroundColor: Colors.gray200 }}
                                >
                                    <Text bodyLarge black className="font-semibold">No Submitted Tags Yet</Text>
                                    <Text bodySmall black className="text-center">This user has not been rated with any tags yet.</Text>
                                </View>
                            }
                        </Card>
                        <Card
                            style={{ backgroundColor: Colors.bgDefault }}
                            className="flex flex-col w-full p-4 space-y-2"
                            elevation={10}
                        >
                            <Text bodyLarge className="font-bold">Top Negative Tags</Text>
                            {ratings.client && ratings.merchant && (ratingsRole === "Seller" ? ratings.merchant : ratings.client).tags.length > 0 ?
                                <View className="flex flex-row w-full space-x-4 items-center justify-center">
                                    <PieChart
                                        data={(ratingsRole === "Seller" ? ratings.merchant : ratings.client).tags.filter(tag => tag.type === "Negative").sort(
                                            (a, b) => b.count - a.count
                                        ).slice(0, 4).map((tag, index) => ({
                                            value: tag.count,
                                            color: interpolateColor("error700", "error100", index / ((ratingsRole === "Seller" ? ratings.merchant : ratings.client)?.tags.length || 7)),
                                            text: tag.count.toString(),
                                        }))}
                                        focusOnPress
                                        radius={70}
                                    />
                                    <View className="flex flex-col flex-1 space-y-2">
                                        {(ratingsRole === "Seller" ? ratings.merchant : ratings.client).tags.filter(tag => tag.type === "Negative").sort(
                                            (a, b) => b.count - a.count
                                        ).slice(0, 4).map((tag, index) => (
                                            <View className="flex flex-row space-x-2 items-center">
                                                {renderDot(10, interpolateColor("error700", "error100", index / ((ratingsRole === "Seller" ? ratings.merchant : ratings.client)?.tags.length || 7)))}
                                                <View className="flex flex-col">
                                                    <Text bodySmall gray900>{tag.tag}</Text>
                                                    <Text caption gray400>Count: {tag.count}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                :
                                <View
                                    className="flex w-full px-2 py-4 space-y-1 items-center justify-center"
                                    style={{ backgroundColor: Colors.gray200 }}
                                >
                                    <Text bodyLarge black className="font-semibold">No Submitted Tags Yet</Text>
                                    <Text bodySmall black className="text-center">This user has not been rated with any tags yet.</Text>
                                </View>
                            }
                        </Card>
                        <Card
                            style={{ backgroundColor: Colors.bgDefault }}
                            className="flex flex-col w-full p-4 space-y-2"
                            elevation={10}
                        >
                            <Text bodyLarge className="font-bold">Recent {ratingsRole} Ratings</Text>
                            {ratings && ratings.client && ratings.merchant && (ratingsRole === "Seller" ? ratings.merchant : ratings.client).list.length > 0 ?
                                <View className="flex flex-col w-full space-y-2">
                                    {(ratingsRole === "Seller" ? ratings.merchant : ratings.client)?.list.map(rating => (
                                        <Card
                                            style={{ backgroundColor: Colors.bgDefault, borderWidth: 1, borderColor: Colors.gray200 }}
                                            className="flex flex-col w-full p-4 space-y-2 rounded-lg"
                                            onPress={() => router.push(`/transaction/${rating.transaction_id}`)}
                                        >
                                            <View className="flex flex-row w-full space-x-4 items-center justify-between">
                                                <View className="flex flex-row flex-1 space-x-2 items-center">
                                                    <Avatar
                                                        name={rating.sender_name}
                                                        labelColor={Colors.bgDefault}
                                                        size={30}
                                                        useAutoColors={true}
                                                        autoColorsConfig={{
                                                            avatarColors: [Colors.primary400, Colors.primary600, Colors.primary800]
                                                        }}
                                                    />
                                                    <View className="flex flex-col w-1/3">
                                                        <Text body className="font-bold">{rating.sender_name || "User"}</Text>
                                                        <View className="flex flex-row w-full items-center">
                                                            <Text caption gray400>Transaction: </Text>
                                                            <Marquee
                                                                label={rating.transaction_id}
                                                                direction={MarqueeDirections.LEFT}
                                                                duration={30000}
                                                                labelStyle={{ color: Colors.gray400 }}
                                                            />
                                                        </View>
                                                    </View>
                                                </View>
                                                <MaterialCommunityIcons name={rating.rating === "UP" ? "thumb-up" : "thumb-down"} size={20} color={rating.rating === "UP" ? Colors.success400 : Colors.error400} />
                                            </View>
                                            {rating.tags.length > 0 && (
                                                <View className="flex flex-row flex-wrap space-x-1 space-y-1 items-center">
                                                    {rating.tags.map((tag, index) => (
                                                        <Chip
                                                            key={index}
                                                            style={{ backgroundColor: rating.rating === "UP" ? Colors.success200 : Colors.error200 }}
                                                            textStyle={{ 
                                                                color: rating.rating === "UP" ? Colors.success700 : Colors.error700, 
                                                                fontWeight: "normal",
                                                                fontSize: 12, 
                                                            }}
                                                            compact={true}
                                                        >
                                                            {tag}
                                                        </Chip>
                                                    ))}
                                                </View>
                                            )}
                                        </Card>
                                    ))}
                                </View>
                                :
                                <View
                                    className="flex w-full px-2 py-4 space-y-1 items-center justify-center"
                                    style={{ backgroundColor: Colors.gray200 }}
                                >
                                    <Text bodyLarge black className="font-semibold">No Ratings Yet</Text>
                                    <Text bodySmall black className="text-center">This user has not transacted with any {ratingsRole === "Seller" ? "buyers" : "sellers"} yet.</Text>
                                </View>
                            }
                        </Card>
                    </View>
                )}
            </View>
        </ScrollView>
    )
}