import { useState, useEffect } from "react";
import { Platform, KeyboardAvoidingView, ScrollView, Dimensions, StyleSheet } from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import { Colors, View, Text, Card, Timeline, Dialog, TouchableOpacity, AnimatedImage, Image, Button, Marquee, MarqueeDirections } from "react-native-ui-lib";

import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { setStringAsync } from "expo-clipboard";

import { supabase } from "@/supabase/config";

import { Transaction, WalletData, UserData, Rating, Ratings } from "@/lib/helpers/types";
import { formatISODate } from "@/lib/helpers/functions";
import { useUserData } from "@/lib/context/UserContext";

import { WalletAnalytics } from "./WalletAnalytics";
import { WalletOwners } from "./WalletOwners";
import { WalletHistory } from "./WalletHistory";

import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";

export default function WalletDetailsScreen() {
    const [dimensions, setDimensions] = useState<{
        width: number;
        height: number;
    }>({
        width: Dimensions.get("screen").width,
        height: Dimensions.get("screen").height,
    });

    const { walletID } = useLocalSearchParams<{ walletID: string }>();
    const { userData, setWalletData } = useUserData();

    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const Tab = createMaterialTopTabNavigator();

    const listWarnings = (transactions: Transaction[], ratings: Rating[]) => {
        let warnings: string[] = [];
        const compiledRatings = ratings.reduce((acc, curr) => {
            curr.tags.forEach((tag: string) => {
                const existingTag = acc.find(t => t.tag === tag);
                if (existingTag) {
                    existingTag.count++;
                } else {
                    acc.push({ tag, count: 1, type: curr.rating === "UP" ? "Positive" : "Negative" });
                }
            });
            return acc;
        }, [] as { tag: string; count: number; type: "Positive" | "Negative" }[]);

        if (compiledRatings.map(rating => rating.tag).includes("Scam")) { warnings.push("Wallet has transactions rated as Fraudulent"); }
        if (compiledRatings.map(rating => rating.tag).includes("Scam") && compiledRatings.filter(rating => rating.tag === "Scam").length > 1) { warnings.push("Wallet has more than one fraudulent transactions"); } 
        
        return warnings;
    }

    const getWalletData = async () => {
        if (userData) {
            try {
                const { data, error } = await supabase
                    .from("wallets")
                    .select("*")
                    .eq("id", walletID);

                if (!error && data) {
                    const { data: transactionData, error: transactionError } = await supabase
                        .from("transactions")
                        .select("*");

                    const { data: ownersData, error: ownersError } = await supabase
                        .from("accounts")
                        .select("*");

                    const { data: ratingsData, error: ratingsError } = await supabase
                        .from("ratings")
                        .select("*");

                    if (!transactionError && transactionData && !ownersError && ownersData && !ratingsError && ratingsData) {
                        const transactionsMade: Transaction[] = transactionData.filter(transaction => transaction.wallets_used && transaction.wallets_used.includes(walletID));
                        const currentOwners: UserData[] = ownersData.filter(owner => data[0].current_owners.includes(owner.id));
                        const previousOwners: UserData[] = ownersData.filter(owner => data[0].previous_owners.includes(owner.id));
                        const relevantRatings: Rating[] = ratingsData.filter(rating => transactionsMade.some(transaction => transaction.id === rating.transaction_id));

                        setWalletData({
                            wallet: data[0],
                            transactions: transactionsMade,
                            owners: {
                                current: currentOwners,
                                previous: previousOwners,
                            },
                            ratings: relevantRatings,
                            insights: listWarnings(transactionsMade, relevantRatings),
                        });

                        navigation.setOptions({
                            header: () => (
                                <View
                                    className="flex flex-row w-full px-4 items-center justify-between"
                                    style={styles.headerStyle}
                                >
                                    <View className="flex flex-col w-1/2 justify-center">
                                        <Text bodyLarge className="font-bold">Wallet Details</Text>
                                        <TouchableOpacity onPress={async () => await setStringAsync(data[0].id)}>
                                            <View className="flex flex-row space-x-1 items-center">
                                                <Text bodySmall>ID: </Text>
                                                <Marquee
                                                    label={`${data[0].id}`}
                                                    labelStyle={{ color: Colors.gray400 }}
                                                    direction={MarqueeDirections.LEFT}
                                                    duration={30000}
                                                />
                                            </View>
                                        </TouchableOpacity>
                                        <Text bodySmall>{formatISODate(data[0].created_at.toLocaleString())}</Text>
                                    </View>
                                </View>
                            ),
                        });
                    } else {
                        console.log(transactionError || ownersError || ratingsError)
                    }
                } else {
                    console.log(error);
                }

            } catch (error) {
                console.log(error);
            }
        }
    }

    useEffect(() => {
        getWalletData();

        return () => {
            setWalletData(null);
        }
    }, []);

    const styles = StyleSheet.create({
        headerStyle: {
            backgroundColor: Colors.bgDefault,
            paddingTop: insets.top + 4,
            paddingBottom: 4,

            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                },
                android: {
                    elevation: 4,
                },
            }),
        }
    })

    return (
        <SafeAreaView className="flex flex-col w-full h-full pb-2 items-center justify-start">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
                className="flex flex-col w-full h-full justify-between"
            >
                <Tab.Navigator
                    screenOptions={() => ({
                        tabBarActiveTintColor: Colors.primary700,
                        tabBarInactiveTintColor: Colors.gray500,
                        tabBarPressColor: Colors.gray200,
                        tabBarBounces: true,
                    })}
                >
                    <Tab.Screen name="Analytics" component={WalletAnalytics} />
                    <Tab.Screen name="Owners" component={WalletOwners} />
                    <Tab.Screen name="Usage" component={WalletHistory} />
                </Tab.Navigator>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
