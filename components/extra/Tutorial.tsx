// components/Tutorial.tsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { findNodeHandle, AccessibilityInfo } from 'react-native';
import { Colors, FeatureHighlight, Typography } from 'react-native-ui-lib';

interface TutorialProps {
    titles: string[];
    messages: string[];
    showFTE: boolean;
    setShowFTE: (value: boolean) => void;
    onClose?: () => void;
}

const Tutorial = forwardRef<any, TutorialProps>((props, ref) => {
    const { titles, messages, showFTE, setShowFTE, onClose } = props;
    const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
    const targets: { [key: string]: any } = {};
    
    useImperativeHandle(ref, () => ({
        showHighlight: () => {
            setCurrentTargetIndex(0);
            setShowFTE(true);
        },
        addTarget: (ref: any, id: string, callback?: () => void) => {
            if (ref && !targets[id]) {
                targets[id] = ref;
                callback && callback();
            }
        },
    }));

    const closeHighlight = () => {
        setShowFTE(false);
        onClose && onClose();

        if (Object.keys(targets).length > 0) {
            const firstTargetKey = Object.keys(targets)[0];
            const reactTag = findNodeHandle(targets[firstTargetKey]);
            reactTag && AccessibilityInfo.setAccessibilityFocus(reactTag);
        }
    };

    const moveToPage = (index: number) => {
        if (index < Object.keys(targets).length) {
            setCurrentTargetIndex(index);
        } else {
            closeHighlight();
        }
    };

    const getPageControlProps = () => {
        return {
            numOfPages: titles.length,
            currentPage: currentTargetIndex,
            onPagePress: moveToPage,
            color: Colors.grey30,
            inactiveColor: Colors.grey80,
            size: 8,
        };
    };

    // useEffect(() => {
    //     console.log("Target updated: ", targets);
    // }, [targets]);

    return (
        <FeatureHighlight
            visible={showFTE}
            title={titles[currentTargetIndex]}
            message={messages[currentTargetIndex]}
            titleStyle={
                currentTargetIndex === titles.length - 1 ? { ...Typography.text70 } : undefined
            }
            messageStyle={
                currentTargetIndex === titles.length - 1
                    ? { ...Typography.text60, fontWeight: '900', lineHeight: 28 }
                    : undefined
            }
            confirmButtonProps={{ label: 'Got It', onPress: () => moveToPage(currentTargetIndex + 1) }}
            onBackgroundPress={closeHighlight}
            getTarget={() => targets[currentTargetIndex]}
            borderRadius={4}
            pageControlProps={currentTargetIndex < titles.length - 1 ? getPageControlProps() : undefined}
        />
    );
});

export default Tutorial;
