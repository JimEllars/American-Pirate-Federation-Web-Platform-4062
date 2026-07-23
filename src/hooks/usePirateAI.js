import { useState, useEffect } from 'react';
import { aiConfig } from '../lib/api/aiConfig';

/**
 * useAnalyzeFederationData
 * Dormant AI hook scaffolded for future launch phases.
 * Does not interact with the UI. Isolated for build safety.
 */
/**
 * formatFeedForAI
 * Dormant AI utility to scrub raw JSON/HTML feeds into dense text context.
 * Useful for optimizing LLM token limits before submission.
 */
export const formatFeedForAI = (rawDataArray) => {
    if (!Array.isArray(rawDataArray)) return '';
    return rawDataArray.map(item => {
        const title = item?.title || '';
        const content = item?.content || '';
        // Strip out HTML tags for token efficiency
        const cleanContent = content.replace(/<[^>]*>?/gm, '');
        return `Title: ${title}\nContent: ${cleanContent}\n---`;
    }).join('\n');
};

export const useAnalyzeFederationData = (contextPayload) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeData = async (payload) => {
        setIsAnalyzing(true);
        // AI endpoint config stored safely for the future
        const config = aiConfig;

        // Mocked promise returning dormant state
        return new Promise((resolve) => {
            setTimeout(() => {
                setIsAnalyzing(false);
                resolve({
                    isAnalyzing: false,
                    aiResponse: null
                });
            }, 500);
        });
    };

    useEffect(() => {
        if (contextPayload && contextPayload.length > 0) {
            // Passively execute on payload change
            analyzeData(contextPayload).catch(() => {
                setIsAnalyzing(false);
            });
        }
    }, [contextPayload]);

    return {
        isAnalyzing,
        analyzeData
    };
};
