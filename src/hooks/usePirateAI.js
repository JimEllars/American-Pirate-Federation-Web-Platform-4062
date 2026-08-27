import { useState, useEffect } from 'react';
import { aiConfig } from '../lib/api/aiConfig';
import { parseAICommand } from '../lib/api/aiActionParser';
import { sendOrQueueTelemetry, logUnhandledRejection } from '../lib/api/telemetry';

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

const getCachedTacticalBrief = () => {
    try {
        const cached = localStorage.getItem('apf_tactical_brief_cache');
        return cached ? JSON.parse(cached) : null;
    } catch(e) {
        return null;
    }
};

const saveTacticalBriefCache = (brief) => {
    try {
        localStorage.setItem('apf_tactical_brief_cache', JSON.stringify(brief));
    } catch(e) {
        // ignore
    }
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
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Strict 8s timeout

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

            // Cache successful responses for fallback
            saveTacticalBriefCache(data);

            // Emit success telemetry
            sendOrQueueTelemetry('/api/telemetry', {
                meta: { source: 'useAnalyzeFederationData', event_type: 'ai.prompt.success', timestamp: new Date().toISOString() },
                telemetry: { latency_ms: Date.now() - startTime }
            });

            setIsAnalyzing(false);
            setLastSyncTime(new Date().toISOString());
            return { isAnalyzing: false, aiResponse: data };

        } catch (error) {
            logUnhandledRejection(`AI Stream Failure: ${error.message}`);

            // Emit failure telemetry
            sendOrQueueTelemetry('/api/telemetry', {
                meta: { source: 'useAnalyzeFederationData', event_type: 'ai.prompt.failure', timestamp: new Date().toISOString() },
                telemetry: { reason: error.message, latency_ms: Date.now() - startTime }
            });

            setIsAnalyzing(false);

            const cachedBrief = getCachedTacticalBrief();

            return {
                isAnalyzing: false,
                aiResponse: cachedBrief || {
                    status: 'fallback',
                    message: '<span class="text-red-500">[ SYSTEM ERROR: AI CORE OFFLINE - RENDERING CACHED INTELLIGENCE ]</span>\n\nProceed with standard operational procedures. Network telemetry suggests a temporal disruption in the consensus layer.',
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
