import { useCallback, useState } from 'react';
import { Node, XYPosition } from '@xyflow/react';

export type HelperLines = {
    v?: number;
    h?: number;
};

export const useHelperLines = () => {
    const [helperLines, setHelperLines] = useState<HelperLines>({});

    const calculateHelperLines = useCallback(
        (targetNode: Node, nodes: Node[]) => {
            const { x, y } = targetNode.position;
            const width = targetNode.measured?.width || 0;
            const height = targetNode.measured?.height || 0;

            const result: HelperLines = {};

            let minVerticalDistance = Infinity;
            let minHorizontalDistance = Infinity;

            nodes.forEach((node) => {
                if (node.id === targetNode.id) return;

                const nodeX = node.position.x;
                const nodeY = node.position.y;
                const nodeWidth = node.measured?.width || 0;
                const nodeHeight = node.measured?.height || 0;

                // Vertical lines
                const vDistances = [
                    { dist: Math.abs(x - nodeX), line: nodeX },
                    { dist: Math.abs(x + width - (nodeX + nodeWidth)), line: nodeX + nodeWidth },
                    { dist: Math.abs(x + width / 2 - (nodeX + nodeWidth / 2)), line: nodeX + nodeWidth / 2 },
                    { dist: Math.abs(x - (nodeX + nodeWidth)), line: nodeX + nodeWidth },
                    { dist: Math.abs(x + width - nodeX), line: nodeX },
                ];

                vDistances.forEach(({ dist, line }) => {
                    if (dist < 5 && dist < minVerticalDistance) {
                        result.v = line;
                        minVerticalDistance = dist;
                    }
                });

                // Horizontal lines
                const hDistances = [
                    { dist: Math.abs(y - nodeY), line: nodeY },
                    { dist: Math.abs(y + height - (nodeY + nodeHeight)), line: nodeY + nodeHeight },
                    { dist: Math.abs(y + height / 2 - (nodeY + nodeHeight / 2)), line: nodeY + nodeHeight / 2 },
                    { dist: Math.abs(y - (nodeY + nodeHeight)), line: nodeY + nodeHeight },
                    { dist: Math.abs(y + height - nodeY), line: nodeY },
                ];

                hDistances.forEach(({ dist, line }) => {
                    if (dist < 5 && dist < minHorizontalDistance) {
                        result.h = line;
                        minHorizontalDistance = dist;
                    }
                });
            });

            setHelperLines(result);
            return result;
        },
        []
    );

    return {
        helperLines,
        setHelperLines,
        calculateHelperLines,
    };
};
