import { useState, useEffect } from 'react';
import { aiConfig } from '../lib/api/aiConfig';
import { parseAICommand } from '../lib/api/aiActionParser';
import { sendOrQueueTelemetry } from '../lib/api/telemetry';

export const formatFeedForAI = (rawDataArray) => {
    if (!Array.isArray(rawDataArray)) return '';
    return rawDataArray.map(item => {
        const title = item?.title || '';
        const content = item?.content || '';
        const cleanContent = content.replace(/<[^>]*>?/gm, '');
        return `Title: ${title}\nContent: ${cleanContent}\n---`;
    }).join('\n');
};

export const checkAIHealth = async () => {
    try {
        const aiEndpoint = import.meta.env.VITE_AI_ENDPOINT;
        if (!aiEndpoint) return;
        const response = await fetch(aiEndpoint, { method: 'OPTIONS' });
        if (response.ok) {
            console.info('[ AI_ENDPOINT_VERIFIED ]');
        }
    } catch (error) { /* empty */ }
};

export const useAnalyzeFederationData = (contextPayload) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    const analyzeData = async (payload, retryCount = 0) => {
        setIsAnalyzing(true);
        const startTime = Date.now();
        try {
            const aiEndpoint = import.meta.env.VITE_AI_ENDPOINT;
            if (!aiEndpoint) {
                console.warn('[ AI_ENDPOINT NOT CONFIGURED ]');
                setIsAnalyzing(false);
                return { isAnalyzing: false, aiResponse: null };
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(aiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aiContextPayload: payload }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                if ((response.status === 503 || response.status === 429) && retryCount < 2) {
                    // Exponential backoff retry
                    await new Promise(res => setTimeout(res, 1000 * Math.pow(2, retryCount)));
                    return analyzeData(payload, retryCount + 1);
                }
                throw new Error(`AI Gateway Error: ${response.status}`);
            }

            const data = await response.json();

            // Emit success telemetry
            sendOrQueueTelemetry('/api/telemetry', {
                meta: { source: 'useAnalyzeFederationData', event_type: 'ai.prompt.success', timestamp: new Date().toISOString() },
                telemetry: { latency_ms: Date.now() - startTime }
            });

            setIsAnalyzing(false);
            setLastSyncTime(new Date().toISOString());
            return { isAnalyzing: false, aiResponse: data };

        } catch (error) {
            // Emit failure telemetry
            sendOrQueueTelemetry('/api/telemetry', {
                meta: { source: 'useAnalyzeFederationData', event_type: 'ai.prompt.failure', timestamp: new Date().toISOString() },
                telemetry: { reason: error.message, latency_ms: Date.now() - startTime }
            });

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
            analyzeData(contextPayload).catch(() => {
                setIsAnalyzing(false);
            });
        }
    }, [contextPayload]);

    return { isAnalyzing, analyzeData, lastSyncTime };
};

export const executePirateCommand = (rawAiResponse) => {
    const { hasAction, command } = parseAICommand(rawAiResponse);
    if (!hasAction) return;
    switch (command?.type) {
        case 'DRAFT_POLICY':
            console.info(`[ SYSTEM: EXECUTING ${command.type} ]`);
            break;
        case 'QUERY_TREASURY':
            console.info(`[ SYSTEM: EXECUTING ${command.type} ]`);
            break;
        case 'MUSTER_FLEET':
            console.info(`[ SYSTEM: EXECUTING ${command.type} ]`);
            break;
        default:
            console.info(`[ SYSTEM: UNKNOWN COMMAND ${command?.type || 'UNKNOWN'} ]`);
    }
};
