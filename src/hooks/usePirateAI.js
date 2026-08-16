import { useState, useEffect } from 'react';
import { aiConfig } from '../lib/api/aiConfig';
import { parseAICommand } from '../lib/api/aiActionParser';

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


export const checkAIHealth = async () => {
    try {
        const aiEndpoint = import.meta.env.VITE_AI_ENDPOINT;
        if (!aiEndpoint) return;

        const response = await fetch(aiEndpoint, {
            method: 'OPTIONS', // lightweight ping
        });

        if (response.ok) {
            console.info('[ AI_ENDPOINT_VERIFIED ]');
        }
    } catch (error) {
        // Passive fail, do not block UI
    }
};

export const useAnalyzeFederationData = (contextPayload) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    const analyzeData = async (payload) => {
        setIsAnalyzing(true);
        // AI endpoint config stored safely for the future
        const config = aiConfig;

        try {
            const aiEndpoint = import.meta.env.VITE_AI_ENDPOINT;
            if (!aiEndpoint) {
                console.warn('[ AI_ENDPOINT NOT CONFIGURED ]');
                setIsAnalyzing(false);
                return { isAnalyzing: false, aiResponse: null };
            }

            const response = await fetch(aiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ aiContextPayload: payload })
            });

            if (!response.ok) {
                throw new Error(`AI Gateway Error: ${response.status}`);
            }

            const data = await response.json();
            setIsAnalyzing(false);
            setLastSyncTime(new Date().toISOString());
            return {
                isAnalyzing: false,
                aiResponse: data
            };

        } catch (error) {
            // console.error('[ AI_TRANSMISSION_FAILED ]', error);
            setIsAnalyzing(false);
            return {
                isAnalyzing: false,
                aiResponse: {
                    status: 'fallback',
                    message: '[ SYSTEM WARNING: OFFLINE MODE ACTIVE ]',
                    timestamp: new Date().toISOString()
                }
            };
        }
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
        analyzeData,
        lastSyncTime
    };
};


export const executePirateCommand = (rawAiResponse) => {
    const { hasAction, command } = parseAICommand(rawAiResponse);
    if (!hasAction) return;

    switch (command) {
        case 'DRAFT_POLICY':
            console.info(`[ SYSTEM: EXECUTING ${command} ]`);
            break;
        case 'QUERY_TREASURY':
            console.info(`[ SYSTEM: EXECUTING ${command} ]`);
            break;
        case 'MUSTER_FLEET':
            console.info(`[ SYSTEM: EXECUTING ${command} ]`);
            break;
        default:
            console.info(`[ SYSTEM: UNKNOWN COMMAND ${command} ]`);
    }
};
