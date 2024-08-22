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
            
        </SafeAreaView>
    );
}