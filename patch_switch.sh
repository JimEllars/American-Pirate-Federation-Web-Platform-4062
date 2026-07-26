#!/bin/bash
sed -i 's/console.error(e);/\/\/ console.error(e);/g' src/components/web3/NetworkSwitchModal.jsx
