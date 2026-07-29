import { prepareContractCall, sendTransaction } from 'thirdweb';

export const processQueuedTransaction = async (txPayload, thirdwebClient) => {
  switch (txPayload.command) {
    case 'DRAFT_POLICY':
    case 'EXECUTE_TREASURY_TRANSFER':
      console.info('[ SYSTEM: PROCESSOR READY FOR ABI INJECTION ]');
      /*
      // 5% Scaffolding for Thirdweb Contract Calls
      const contract = getContract({
        client: thirdwebClient,
        chain: ARBITRUM_CHAIN_ID,
        address: txPayload.targetAddress
      });

      const tx = prepareContractCall({
        contract,
        method: "function executeAction(bytes32 payload)",
        params: [txPayload.encodedData]
      });

      const { transactionHash } = await sendTransaction({
        transaction: tx,
        account: activeAccount
      });
      console.info('[ SYSTEM: TX MINED ]', transactionHash);
      */
      return Promise.resolve(true); // Return safely for the Navbar to process
    default:
      console.info('[ SYSTEM: UNKNOWN COMMAND IN PROCESSOR ]');
      return Promise.resolve(true);
  }
};