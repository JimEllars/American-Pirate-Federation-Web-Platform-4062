#!/bin/bash
sed -i 's/console.error(e);/\/\/ console.error(e);/g' src/components/web3/NetworkSwitchModal.jsx
sed -i 's/console.error(\x27APF System Integrity Failure:\x27, error, errorInfo);/\/\/ console.error(\x27APF System Integrity Failure:\x27, error, errorInfo);/g' src/components/ErrorBoundary.jsx
sed -i 's/console.error(\x27\[ TRANSMISSION FETCH ERROR \]\x27, err);/\/\/ console.error(\x27\[ TRANSMISSION FETCH ERROR \]\x27, err);/g' src/pages/TransmissionHub.jsx
sed -i 's/console.error(\x27\[ AI_TRANSMISSION_FAILED \]\x27, error);/\/\/ console.error(\x27\[ AI_TRANSMISSION_FAILED \]\x27, error);/g' src/hooks/usePirateAI.js
sed -i 's/console.error(\x27\[ SECURITY EXCEPTION: CORRUPTED OFFLINE PAYLOAD DROP ENFORCED \]\x27);/\/\/ console.error(\x27\[ SECURITY EXCEPTION: CORRUPTED OFFLINE PAYLOAD DROP ENFORCED \]\x27);/g' src/components/layout/Layout.jsx
