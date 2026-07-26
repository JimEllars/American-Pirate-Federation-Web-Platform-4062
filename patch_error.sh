#!/bin/bash
sed -i 's/logUnhandledRejection("\[ AI_TRANSMISSION_FAILED \]", err.message);/logUnhandledRejection(`[ AI_TRANSMISSION_FAILED ] ${err.message}`);/g' src/pages/IntelligenceHub.jsx
