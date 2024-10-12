import { FC } from "react";

import { ViewStyle, TouchableOpacity } from "react-native";
import { Avatar } from "react-native-paper";
import { Colors, View, Text, Marquee, MarqueeDirections } from "react-native-ui-lib";

import { setStringAsync } from "expo-clipboard";

import { getInitials } from "@/lib/helpers/functions";

interface UserCardProps {
    style?: ViewStyle;
    idStyle?: ViewStyle;
    name: string | undefined;
    id: string;
}

export const UserCard: FC<UserCardProps> = ({ style, idStyle, name, id }) => {
    return (
        <View style={style} className="flex flex-row flex-1 gap-2 items-center justify-start">
            {name ?
                <Avatar.Text label={getInitials(name)} size={30} />
                :
                <Avatar.Text label="N/A" size={30} />
            }
            <View className="flex flex-col items-start justify-center">
                <Text 
                    bodyLarge 
                    className="font-bold"
                    numberOfLines={1}
                    ellipsizeMode={"tail"}
                >
                    {name || "N/A"}
                </Text>
                <TouchableOpacity onPress={async () => await setStringAsync(id)}>
                    {/* <Text 
                        bodySmall
                        numberOfLines={1}
                        ellipsizeMode={"tail"}
                    >
                        ID: {id}
                    </Text> */}
                    <Marquee 
                        label={`ID: ${id}`}
                        direction={MarqueeDirections.LEFT}
                        duration={30000}
                        containerStyle={idStyle}
                    />
                </TouchableOpacity>
            </View>
        </View>
    )
}

