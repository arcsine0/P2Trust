import { useState, useEffect, useRef } from "react";
import { FlatList, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Avatar, Snackbar, ActivityIndicator, IconButton, TextInput } from "react-native-paper";

import { Colors, View, Text, Button, Wizard, Dialog, Picker, PickerModes } from "react-native-ui-lib";

import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native-ui-lib";
import DocumentScanner, { ScanDocumentResponseStatus } from "react-native-document-scanner-plugin";
import { scanFromURLAsync } from "expo-camera";

import { router, useNavigation } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { IDTypes } from "@/lib/helpers/collections";
import { NationalID } from "@/lib/helpers/types";
import { capitalizeName } from "@/lib/helpers/functions";

import { MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";

export default function UserVerifyScreen() {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [completedStepIndex, setCompletedStepIndex] = useState<number>(0);

    const [IDType, setIDType] = useState<string | undefined>("NationalID");
    const [IDImage, setIDImage] = useState<string | undefined>(undefined);
    const [IDData, setIDData] = useState<NationalID | undefined>(undefined);

    const [isIDNameDisabled, setIsIDNameDisabled] = useState<boolean>(true);
    const [isIDNumberDisabled, setIsIDNumberDisabled] = useState<boolean>(true);

    const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
    const [isImagePickerLoading, setIsImagePickerLoading] = useState<boolean>(false);
    const [isVerificationSending, setIsVerificationSending] = useState<boolean>(false);
    const [isIDSubmitting, setIsIDSubmitting] = useState<boolean>(false);

    const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false);

    const { userData, setUserData } = useUserData();

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
        const { scannedImages: scannedID, status } = await DocumentScanner.scanDocument({
            maxNumDocuments: 1,
        });

        if (status === ScanDocumentResponseStatus.Success && scannedID) {
            console.log(scannedID);
            setIDImage(scannedID[0]);
        } else {
            console.log(scannedID);
        }
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
            setIDImage(result.assets[0].uri);
        } else {
            setIsImagePickerLoading(false);
        }
    }

    const verifyID = async () => {
        setIsVerificationSending(true);

        if (IDImage) {
            try {
                const scannedResults = await scanFromURLAsync(IDImage);

                if (scannedResults) {
                    const IDData = JSON.parse(scannedResults[0].data);

                    setIDData(IDData);
                    setIsVerificationSending(false);

                    goToNextStep();
                } else {
                    setIsVerificationSending(false);
                }
            } catch (error) {
                console.log(error);
                setIsVerificationSending(false);
            }
        }
    }

    const submitID = async () => {
        setIsIDSubmitting(true);

        try {
            if (IDData) {
                const { data: existingUser, error: existingUserError } = await supabase
                    .from("accounts")
                    .select("id")
                    .eq("isVerified", true)
                    .eq("verifiedID_type", IDType)
                    .eq("verifiedID_number", IDData.subject.PCN);

                if (!existingUserError && existingUser) {
                    if (existingUser.length === 0) {
                        const { data: updatedUserData, error: updateError } = await supabase
                            .from("accounts")
                            .update({
                                firstname: capitalizeName(IDData.subject.fName),
                                lastname: capitalizeName(IDData.subject.lName),
                                isVerified: true,
                                verified_at: new Date(),
                                verifiedID_type: IDType,
                                verifiedID_number: IDData.subject.PCN,
                            })
                            .eq("id", userData?.id)
                            .select();

                        if (!updateError) {
                            setUserData(updatedUserData[0]);
                            setIsIDSubmitting(false)

                            router.navigate("/(tabs)");
                        } else {
                            setIsIDSubmitting(false);
                            console.log("Verify Update error: ", updateError);
                        }
                    } else {
                        setIsIDSubmitting(false);
                        setShowVerifyDialog(true);
                    }
                } else {
                    setIsIDSubmitting(false);
                }
            }
        } catch (error) {
            console.log(error);
            setIsIDSubmitting(false);
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
                            <Picker.Item key={i} label={id.label} value={id.value} disabled={id.disabled} />
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
                            source={{ uri: IDImage }}
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
                    <Text caption className="text-center">For National IDs, take a picture of the <Text className="font-bold">BACK</Text> of the ID where the <Text className="font-bold">QR Code</Text> is located.</Text>
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
        if (IDData) return (
            <View className="flex flex-col px-4 w-full space-y-4">
                <View
                    className="flex flex-row p-4 space-x-2 items-center rounded-lg"
                    style={{ backgroundColor: Colors.gray200 }}
                >
                    <Text bodyLarge className="font-bold">ID Type: </Text>
                    <Text bodyLarge className="font-semibold">{IDType}</Text>
                </View>
                <View className="flex flex-col space-y-1">
                    <View className="flex flex-row space-x-2 items-center justify-between">
                        <Text bodyLarge className="font-bold">Confirm ID Name</Text>
                        <Button
                            backgroundColor={"transparent"}
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
                    <View className="flex flex-col space-y-2">
                        <TextInput
                            className="rounded-lg"
                            style={{ backgroundColor: Colors.gray100 }}
                            mode="outlined"
                            label="First Name"
                            value={IDData.subject.fName}
                            disabled={isIDNameDisabled}
                            onChangeText={text => setIDData(prevData => {
                                if (prevData) {
                                    return {
                                        ...prevData,
                                        subject: {
                                            ...prevData.subject,
                                            fName: text,
                                        },
                                    };
                                } else {
                                    return undefined;
                                }
                            })}
                        />
                        <View className="flex flex-row space-x-2 items-center">
                            <TextInput
                                className="rounded-lg"
                                style={{ backgroundColor: Colors.gray100 }}
                                mode="outlined"
                                label="Middle Name"
                                value={IDData.subject.mName}
                                disabled={isIDNameDisabled}
                                onChangeText={text => setIDData(prevData => {
                                    if (prevData) {
                                        return {
                                            ...prevData,
                                            subject: {
                                                ...prevData.subject,
                                                mName: text,
                                            },
                                        };
                                    } else {
                                        return undefined;
                                    }
                                })}
                            />
                            <TextInput
                                className="rounded-lg flex-1"
                                style={{ backgroundColor: Colors.gray100 }}
                                mode="outlined"
                                label="Last Name"
                                value={IDData.subject.lName}
                                disabled={isIDNameDisabled}
                                onChangeText={text => setIDData(prevData => {
                                    if (prevData) {
                                        return {
                                            ...prevData,
                                            subject: {
                                                ...prevData.subject,
                                                lName: text,
                                            },
                                        };
                                    } else {
                                        return undefined;
                                    }
                                })}
                            />
                        </View>
                    </View>
                </View>
                <View className="flex flex-col space-y-1">
                    <View className="flex flex-row space-x-2 items-center justify-between">
                        <Text bodyLarge className="font-bold">Confirm ID Number</Text>
                        <Button
                            backgroundColor={"transparent"}
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
                    <View className="flex flex-row space-x-2 items-center">
                        <TextInput
                            className="rounded-lg flex-1"
                            style={{ backgroundColor: Colors.gray100 }}
                            mode="outlined"
                            label="ID Number"
                            value={IDData.subject.PCN}
                            disabled={isIDNumberDisabled}
                            onChangeText={text => setIDData(prevData => {
                                if (prevData) {
                                    return {
                                        ...prevData,
                                        subject: {
                                            ...prevData.subject,
                                            PCN: text,
                                        },
                                    };
                                } else {
                                    return undefined;
                                }
                            })}
                        />
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
                            backgroundColor={activeIndex < 1 ? Colors.bgDefault : ""}
                            outline={activeIndex < 1 ? true : false}
                            outlineColor={activeIndex < 1 ? Colors.gray900 : ""}
                            disabled={(() => {
                                switch (activeIndex) {
                                    case 0:
                                        return !IDType;
                                    case 1:
                                        return !IDImage || isVerificationSending;
                                    case 2:
                                        return !IDData?.subject.fName || !IDData?.subject.lName || !IDData?.subject.PCN || isIDSubmitting;
                                }
                            })()}
                            onPress={() => {
                                switch (activeIndex) {
                                    case 0:
                                        goToNextStep();
                                        break;
                                    case 1:
                                        verifyID();
                                        break;
                                    case 2:
                                        submitID();
                                        break;
                                }
                            }}
                        >
                            {activeIndex === 0 && (
                                <View className="flex flex-row space-x-2 items-center">
                                    <Text buttonSmall gray900>Next</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.gray900} />
                                </View>
                            )}
                            {activeIndex === 1 && (
                                <>
                                    {!isVerificationSending ?
                                        <View className="flex flex-row space-x-2 items-center">
                                            <MaterialCommunityIcons name="check" size={20} color="white" />
                                            <Text buttonSmall white>Verify</Text>
                                        </View>
                                        :
                                        <View className="flex flex-row space-x-2 items-center">
                                            <ActivityIndicator animating={true} color={Colors.gray900} />
                                            <Text buttonSmall white>Verifying...</Text>
                                        </View>
                                    }
                                </>
                            )}
                            {activeIndex === 2 && (
                                <>
                                    {!isIDSubmitting ?
                                        <View className="flex flex-row space-x-2 items-center">
                                            <MaterialCommunityIcons name="check" size={20} color="white" />
                                            <Text buttonSmall white>Submit</Text>
                                        </View>
                                        :
                                        <View className="flex flex-row space-x-2 items-center">
                                            <ActivityIndicator animating={true} color={Colors.gray900} />
                                            <Text buttonSmall white>Submiting...</Text>
                                        </View>
                                    }
                                </>
                            )}
                        </Button>
                    </View>
                </View>
                <Dialog
                    visible={showVerifyDialog}
                    ignoreBackgroundPress={true}
                    panDirection="up"
                    containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, padding: 4 }}
                >
                    <View
                        className="flex flex-col w-full p-4 space-y-8"
                    >
                        <View className="flex flex-col w-full space-y-2">
                            <Text h3>Notice</Text>
                            <Text body>This ID has already been bound to another account. Multiple accounts with the same IDs are not allowed.</Text>
                        </View>
                        <View className="flex flex-row w-full items-center justify-end space-x-2">
                            <Button
                                className="rounded-lg"
                                onPress={() => setShowVerifyDialog(false)}
                            >
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="arrow-left" size={20} color={"white"} />
                                    <Text buttonSmall white>Cancel</Text>
                                </View>
                            </Button>
                            <Button
                                className="rounded-lg"
                                onPress={() => {
                                    setShowVerifyDialog(false);
                                    router.navigate("/(tabs)");
                                }}
                            >
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="arrow-u-left-bottom" size={20} color={"white"} />
                                    <Text buttonSmall white>Back to Home</Text>
                                </View>
                            </Button>
                        </View>
                    </View>
                </Dialog>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}