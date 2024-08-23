import { useState } from "react";
import { View, TextInput, ScrollView, TouchableHighlight } from "react-native";
import { useTheme, Text, Card, Avatar, Chip, IconButton, FAB, Portal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransactionStartScreen() {
    const [inputSearch, setInputSearch] = useState("")

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen gap-2 p-2 items-start justify-start">
            
        </SafeAreaView>
    );
}