import { useState, useEffect, FC, Fragment } from "react";
import { LayoutChangeEvent } from "react-native";
import { Colors, View } from "react-native-ui-lib";
import Svg, { Rect, Text } from "react-native-svg";
import * as d3 from "d3";
import { hierarchy, treemap, treemapResquarify } from "d3-hierarchy";

import { Tag } from "@/lib/helpers/types";

interface TreemapChartProps {
    tags: Tag[];
    height?: number
}

interface HierarchyData {
    type: string;
    name: string;
    value: number;
    children?: HierarchyData[];
}

export const TreemapChart: FC<TreemapChartProps> = ({ tags, height }) => {
    const [width, setWidth] = useState<number>(0);

    // Total count of all tags for calculating relative widths
    const total = tags.reduce((acc, tag) => acc + tag.count, 0);

    // Define a color scale for Positive and Negative types
    const colorScale = d3.scaleOrdinal<string>()
        .domain(["Positive", "Negative"])
        .range([Colors.success400, Colors.error400]);

    return (
        <View style={{ width: '100%', height, marginTop: 8 }}>
            <Svg width="100%" height="100%">
                {tags.map((tag, index) => {
                    // Calculate width based on proportion of total count
                    const rectWidth = (tag.count / total) * width;
                    const rectHeight = (height || 300) / Math.ceil(tags.length / 3); // Calculate based on total rows
                    const fontSize = Math.min(rectWidth / 6, rectHeight / 3);

                    // Calculate x and y based on row and column within a 3-column layout
                    const xOffset = (index % 3) * (width / 3);
                    const yOffset = Math.floor(index / 3) * rectHeight;

                    return (
                        <Fragment key={index}>
                            <Rect
                                x={xOffset}
                                y={yOffset}
                                width={rectWidth}
                                height={rectHeight}
                                fill={colorScale(tag.type)}
                                stroke={Colors.bgDefault}
                                strokeWidth={1}
                            />
                            <Text
                                x={xOffset + rectWidth / 2}
                                y={yOffset + rectHeight / 2}
                                fontSize={fontSize}
                                fill="white"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {tag.tag}
                            </Text>
                        </Fragment>
                    );
                })}
            </Svg>
        </View>
    );
};