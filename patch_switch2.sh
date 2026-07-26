#!/bin/bash
sed -i 's/\/\/ console.error(e); }/\/\/ console.error(e);\n    }/g' src/components/web3/NetworkSwitchModal.jsx
