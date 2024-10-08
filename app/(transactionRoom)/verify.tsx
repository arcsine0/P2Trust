import { useState, useEffect, useRef } from "react";
import { FlatList, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Avatar, Snackbar, ActivityIndicator, IconButton, TextInput } from "react-native-paper";

import { Colors, View, Text, Card, Button, Wizard, Picker, PickerModes } from "react-native-ui-lib";

import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native-ui-lib";

import { router, useNavigation } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { IDTypes } from "@/lib/helpers/collections";

import { MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";

export default function UserVerifyScreen() {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [completedStepIndex, setCompletedStepIndex] = useState<number>(0);

    const [IDType, setIDType] = useState<string | undefined>("NationalID");
    const [IDImage, setIDImage] = useState<ImagePicker.ImagePickerAsset | undefined>(undefined);
    const [IDName, setIDName] = useState<string>("");
    const [IDNumber, setIDNumber] = useState<string>("");

    const [isIDNameDisabled, setIsIDNameDisabled] = useState<boolean>(true);
    const [isIDNumberDisabled, setIsIDNumberDisabled] = useState<boolean>(true);

    const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
    const [isImagePickerLoading, setIsImagePickerLoading] = useState<boolean>(false);
    const [isVerificationSending, setIsVerificationSending] = useState<boolean>(false);

    const navigation = useNavigation();

    const goToPrevStep = () => {
        const newActiveIndex = activeIndex === 0 ? 0 : activeIndex - 1;
        setActiveIndex(newActiveIndex);
    };

    const goToNextStep = () => {
        if (activeIndex === 2) {
            console.log("Form submitted!");
            return;
        }

        const newActiveIndex = activeIndex + 1;
        setActiveIndex(newActiveIndex);
        setCompletedStepIndex(newActiveIndex);
    };

    const getStepState = (index: number) => {
        let state = Wizard.States.DISABLED;

        if (completedStepIndex && completedStepIndex > index - 1) {
            state = Wizard.States.COMPLETED;
        } else if (activeIndex === index || completedStepIndex === index - 1) {
            state = Wizard.States.COMPLETED;
        }

        return state;
    }

    const renderCurrentStep = () => {
        switch (activeIndex) {
            default:
            case 0:
                return selectIDPage();
            case 1:
                return uploadIDPage();
            case 2:
                return confirmIDPage();
        }
    }

    const takeIDImage = async () => {

    }

    const pickIDImage = async () => {
        setIsImagePickerLoading(true);

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            base64: true,
            quality: 1,
        });

        if (result && result.assets && result.assets[0].uri) {
            setIsImagePickerLoading(false);
            setIDImage(result.assets[0]);
        } else {
            setIsImagePickerLoading(false);
        }
    }

    const selectIDPage = () => {
        return (
            <View className="flex flex-col px-4 w-full space-y-2">
                <Text bodyLarge className="font-bold">Select ID Type</Text>
                <View
                    style={{ backgroundColor: Colors.gray100, paddingVertical: 13, elevation: 2 }}
                    className="px-2 rounded-lg"
                >
                    <Picker
                        value={IDType}
                        mode={PickerModes.SINGLE}
                        useDialog={true}
                        customPickerProps={{ migrateDialog: true, }}
                        trailingAccessory={<MaterialCommunityIcons name="chevron-down" size={20} color={Colors.gray900} />}
                        onChange={value => {
                            setIDType(value?.toString());
                            setIDImage(undefined);
                        }}
                    >
                        {IDTypes.map((id, i) => (
                            <Picker.Item key={i} label={id.label} value={id.value} />
                        ))}
                    </Picker>
                </View>
            </View>
        )
    }

    const uploadIDPage = () => {
        return (
            <View className="flex flex-1 flex-col px-4 w-full space-y-2 justify-between">
                <View 
                    className="flex flex-1 p-2 items-center justify-center border-2 border-dashed"
                    style={{ borderColor: Colors.gray900 }}
                >
                    {IDImage ?
                        <Image 
                            source={{ uri: IDImage.uri }}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    :
                        <View 
                            className="flex w-full h-full px-8 space-y-1 items-center justify-center"
                            style={{ backgroundColor: Colors.gray200 }}
                        >
                            <Text bodyLarge black className="font-semibold">No Image Uploaded</Text>
                            <Text bodySmall black className="text-center">Take a photo or upload an ID image using the buttons below</Text>
                        </View>
                    }
                </View>
                <View className="flex flex-col w-full space-y-2">
                    <Text caption className="text-center">Make sure that the ID image quality is high and details can be easily read</Text>
                    <Text bodyLarge className="font-bold">Upload ID</Text>
                    <View className="flex flex-row space-x-2 items-center">
                        <Button
                            className="flex-1 rounded-lg"
                            backgroundColor={Colors.gray50}
                            outline={true}
                            outlineColor={Colors.gray900}
                            onPress={() => takeIDImage()}
                        >
                            {!isCameraLoading ?
                                <View className="flex flex-col space-y-1 items-center justify-center">
                                    <MaterialCommunityIcons name="camera" size={20} color={Colors.gray900} />
                                    <Text buttonSmall gray900>Take Photo</Text>
                                </View>

                                :
                                <View className="flex flex-col space-y-1 items-center justify-center">
                                    <ActivityIndicator animating={true} size={20} color={Colors.gray900} />
                                </View>
                            }
                        </Button>
                        <Button
                            className="flex-1 rounded-lg"
                            backgroundColor={Colors.gray50}
                            outline={true}
                            outlineColor={Colors.gray900}
                            disabled={isImagePickerLoading}
                            onPress={() => pickIDImage()}
                        >
                            {!isImagePickerLoading ?
                                <View className="flex flex-col space-y-1 items-center justify-center">
                                    <MaterialCommunityIcons name="folder-image" size={20} color={Colors.gray900} />
                                    <Text buttonSmall gray900>Upload Image</Text>
                                </View>

                                :
                                <View className="flex flex-col space-y-1 items-center justify-center">
                                    <ActivityIndicator animating={true} size={20} color={Colors.gray900} />
                                </View>
                            }
                        </Button>
                    </View>
                </View>
            </View>
        )
    }

    const confirmIDPage = () => {
        return (
            <View className="flex flex-col px-4 w-full space-y-4">
                <View
                    className="flex flex-row p-4 space-x-2 items-center rounded-lg"
                    style={{ backgroundColor: Colors.gray200 }}
                >
                    <Text bodyLarge className="font-bold">ID Type: </Text>
                    <Text bodyLarge className="font-semibold">{IDType}</Text>
                </View>
                <View className="flex flex-col space-y-1">
                    <Text bodyLarge className="font-bold">Confirm ID Name</Text>
                    <View className="flex flex-row space-x-2 items-center">
                        <TextInput
                            className="rounded-lg flex-1"
                            style={{ backgroundColor: Colors.gray100 }}
                            mode="outlined"
                            label="ID Name"
                            value={IDName}
                            disabled={isIDNameDisabled}
                            onChangeText={text => setIDNumber(text)}
                        />
                        <Button
                            style={{ elevation: 2 }}
                            backgroundColor={Colors.gray50}
                            round={true}
                            onPress={() => setIsIDNameDisabled(!isIDNameDisabled)}
                        >
                            {isIDNameDisabled ?
                                <View className="flex flex-col space-y-2 items-center justify-center">
                                    <AntDesign name="edit" size={20} color={Colors.gray900} />
                                </View>

                                :
                                <View className="flex flex-col space-y-2 items-center justify-center">
                                    <MaterialCommunityIcons name="check" size={20} color={Colors.gray900} />
                                </View>
                            }
                        </Button>
                    </View>
                </View>
                <View className="flex flex-col space-y-1">
                    <Text bodyLarge className="font-bold">Confirm ID Number</Text>
                    <View className="flex flex-row space-x-2 items-center">
                        <TextInput
                            className="rounded-lg flex-1"
                            style={{ backgroundColor: Colors.gray100 }}
                            mode="outlined"
                            label="ID Number"
                            value={IDNumber}
                            disabled={isIDNumberDisabled}
                            onChangeText={text => setIDNumber(text)}
                        />
                        <Button
                            style={{ elevation: 2 }}
                            backgroundColor={Colors.gray50}
                            round={true}
                            onPress={() => setIsIDNumberDisabled(!isIDNumberDisabled)}
                        >
                            {isIDNumberDisabled ?
                                <View className="flex flex-col space-y-2 items-center justify-center">
                                    <AntDesign name="edit" size={20} color={Colors.gray900} />
                                </View>

                                :
                                <View className="flex flex-col space-y-2 items-center justify-center">
                                    <MaterialCommunityIcons name="check" size={20} color={Colors.gray900} />
                                </View>
                            }
                        </Button>
                    </View>
                </View>
            </View>
        )
    }

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View className="flex flex-row">
                    <IconButton
                        icon="dots-vertical"
                        onPress={() => console.log("Dots Pressed")}
                    />
                </View>
            )
        });
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-full h-full items-center justify-start">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
                className="flex flex-col space-y-4 w-full h-full"
            >
                <Wizard
                    activeIndex={activeIndex}
                    onActiveIndexChanged={index => setActiveIndex(index)}
                    containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, elevation: 2 }}
                >
                    <Wizard.Step state={getStepState(0)} label="Select ID Type" />
                    <Wizard.Step state={getStepState(1)} label="Upload ID Image" />
                    <Wizard.Step state={getStepState(2)} label="Confirm Details" />
                </Wizard>
                <View className="flex flex-col flex-1 w-full space-y-4 justify-between">
                    {renderCurrentStep()}
                    <View
                        className="flex flex-row p-4 space-x-2 items-center"
                        style={{ backgroundColor: Colors.bgDefault }}
                    >
                        <Button
                            className="flex-1 rounded-lg"
                            backgroundColor={Colors.gray50}
                            outline={true}
                            outlineColor={Colors.gray900}
                            disabled={activeIndex === 0}
                            onPress={() => goToPrevStep()}
                        >
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.gray900} />
                                <Text buttonSmall gray900>Back</Text>
                            </View>
                        </Button>
                        <Button
                            className="flex-1 rounded-lg"
                            backgroundColor={activeIndex < 2 ? Colors.primary800 : Colors.primary700}
                            outline={activeIndex < 2 ? true : false}
                            outlineColor={activeIndex < 2 ? Colors.gray900 : ""}
                            disabled={(() => {
                                switch (activeIndex) {
                                    case 0:
                                        return !IDType;
                                    case 1:
                                        return !IDImage;
                                    case 2:
                                        return !IDName || !IDNumber || isVerificationSending;
                                }
                            })()}
                            onPress={() => {
                                switch (activeIndex) {
                                    case 0:
                                    case 1:
                                        goToNextStep();
                                        break;
                                    case 2:
                                        console.log("Form submitted!");
                                        break;
                                }
                            }}
                        >
                            {activeIndex < 2 ?
                                <View className="flex flex-row space-x-2 items-center">
                                    <Text buttonSmall gray900>Next</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.gray900} />
                                </View>
                                :
                                <>
                                    {!isVerificationSending ?
                                        <View className="flex flex-row space-x-2 items-center">
                                            <Text buttonSmall white>Submit</Text>
                                            <MaterialCommunityIcons name="check" size={20} color="white" />
                                        </View>
                                        :
                                        <View className="flex flex-row space-x-2 items-center">
                                            <Text buttonSmall white>Submiting...</Text>
                                            <ActivityIndicator animating={true} color={Colors.gray900} />
                                        </View>
                                    }
                                </>
                            }
                        </Button>
                    </View>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}