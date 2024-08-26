import { useState } from "react";
import { View, ScrollView, TouchableHighlight } from "react-native";
import { Text, Avatar, Chip, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type TransactionParamList = {
    Index: undefined;
    Info: { id: string };
}

type TransactionScreenNavigationProp = NativeStackNavigationProp<TransactionParamList, "Index">;
type Props = {
	navigation: TransactionScreenNavigationProp;
};

export default function TransactionHomeScreen({ navigation }: Props) {
    return (
        <SafeAreaView className="flex flex-col w-screen h-screen gap-2 p-2 items-start justify-start">
            <Text variant="titleLarge" className="font-bold">Test</Text>
        </SafeAreaView>
    );
}