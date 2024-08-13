import { useState } from "react";
import { Text, View, TextInput, ScrollView, TouchableHighlight } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CountryFlag from "react-native-country-flag";

import { Feather } from "@expo/vector-icons";

export default function MerchantsListScreen() {
    const [inputSearch, setInputSearch] = useState("")

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen gap-5 p-5 items-start justify-start">
            <Text className="font-bold text-slate-800 text-2xl">Select Merchant</Text>
            <TextInput
                className="w-full px-5 bg-white shadow-md rounded-2xl"
                value={inputSearch}
                onChangeText={setInputSearch}
                placeholder="Search merchant name or account number..."
            />
            <ScrollView className="flex flex-col w-full p-2 bg-white divide-y divide-slate-200 shadow-md rounded-2xl">
                <TouchableHighlight
                    onPress={() => router.push("/(tabs)/(transaction)/info")}
                >
                    <View className="flex flex-row p-2 gap-2 items-center">
                        <View className="flex p-2 items-center justify-center border-2 border-black rounded-2xl">
                            <Feather name="user" size={48} />
                        </View>
                        <View className="flex flex-col">
                            <CountryFlag isoCode="ph" size={12} />
                            <Text className="font-bold text-slate-800 text-xl">R***** J*** C****</Text>
                            <Text className="font-bold text-slate-400 text-md">09673127888</Text>
                        </View>
                    </View>
                </TouchableHighlight>
            </ScrollView>
        </SafeAreaView>
    );
}