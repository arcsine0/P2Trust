import { FC } from "react";

import { ViewStyle, TouchableOpacity } from "react-native";
import { Avatar } from "react-native-paper";
import { Colors, View, Text, Card } from "react-native-ui-lib";

import { setStringAsync } from "expo-clipboard";

import { getInitials } from "@/lib/helpers/functions";

interface UserCardProps {
    style?: ViewStyle;
    name: string | undefined;
    id: string;
}

export const UserCard: FC<UserCardProps> = ({ style, name, id }) => {
    return (
        <View style={style} className="flex flex-row gap-2 items-center justify-start">
            {name ?
                <Avatar.Text label={getInitials(name)} size={30} />
                :
                <Avatar.Text label="N/A" size={30} />
            }
            <View className="flex flex-col items-start justify-center">
                <Text bodyLarge className="font-bold">{name || "N/A"}</Text>
                <TouchableOpacity onPress={async () => await setStringAsync(id)}>
                    <Text bodySmall>ID: {id}</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

