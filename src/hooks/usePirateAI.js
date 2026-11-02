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

/**
 * Build the prompt from whatever real content we actually have. Deliberately excludes
 * invented "readiness" scores: the model must not be fed numbers that do not exist.
 */
export const buildBriefingPrompt = (payload) => {
    if (typeof payload === 'string') return payload;

    const posts = Array.isArray(payload?.posts) ? payload.posts : [];
    if (posts.length === 0) {
        return 'No intelligence dispatches are currently published. State plainly that there is nothing to brief.';
    }

    return [
        'Produce a short tactical briefing for Federation members based only on the dispatches below.',
        'Attribute claims to the dispatch titles. Do not invent figures.',
        '',
        formatFeedForAI(posts)
    ].join('\n');
};

export const checkAIHealth = async () => {
    try {
        const response = await fetch(aiConfig.AI_ENDPOINT, { method: 'OPTIONS' });
        return response.ok;
    } catch (error) {
        return false;
    }
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
            // Same-origin edge function. The provider key never reaches the browser.
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

            const prompt = buildBriefingPrompt(payload);

            const response = await fetch(aiConfig.AI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
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

            // Law 1: if the uplink is down we say so. We do not invent a "temporal
            // disruption in the consensus layer" narrative to fill the silence.
            const cachedBrief = getCachedTacticalBrief();

            return {
                isAnalyzing: false,
                error: error.message,
                aiResponse: cachedBrief
                    ? { ...cachedBrief, status: 'cached', stale: true }
                    : {
                        status: 'unavailable',
                        message: 'The intelligence uplink is unavailable. No briefing was generated.',
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
