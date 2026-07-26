#!/bin/bash
sed -i 's/console.error("\[ AI_TRANSMISSION_FAILED \]", err);/\/\/ console.error("[ AI_TRANSMISSION_FAILED ]", err);/g' src/pages/IntelligenceHub.jsx
