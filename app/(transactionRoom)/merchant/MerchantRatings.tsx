import { FC } from "react";
import { ScrollView } from "react-native";

import { Colors, View, Text, Card } from "react-native-ui-lib";

import RatingsBar from "@/components/analytics/RatingBar";

import { useMerchantData } from "@/lib/context/MerchantContext";

export function MerchantRatings() {
    const { ratings } = useMerchantData();
    
    return (
        <ScrollView className="w-full">
                <View className="flex flex-col px-4 pt-4 w-full h-full space-y-2 items-center justify-start">
                    <Card
                        style={{ backgroundColor: Colors.bgDefault }}
                        className="flex flex-col w-full p-4 space-y-2"
                        elevation={10}
                    >
                        <Text bodyLarge className="font-bold">Seller Rating</Text>
                        <View className="flex items-center justify-center">
                            {ratings && ratings.total > 0 ?
                                <RatingsBar
                                    positive={ratings.positive}
                                    negative={ratings.negative}
                                    total={ratings.total}
                                    height={20}
                                />
                                :
                                <View
                                    className="flex w-full px-2 py-4 space-y-1 items-center justify-center"
                                    style={{ backgroundColor: Colors.gray200 }}
                                >
                                    <Text bodyLarge black className="font-semibold">No Ratings Yet</Text>
                                    <Text bodySmall black className="text-center">Only users who have transacted with the merchant can rate them.</Text>
                                </View>
                            }
                        </View>
                    </Card>
                </View>
        </ScrollView>
    )
}