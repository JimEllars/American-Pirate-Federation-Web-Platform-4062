import { prepareContractCall, sendTransaction } from 'thirdweb';
import { PolicyContract as APF_POLICY_CONTRACT } from './contracts.js';

export const processQueuedTransaction = async (txPayload, account) => {
  switch (txPayload.command) {
    case 'DRAFT_POLICY':
      console.info('[ SYSTEM: PROCESSOR EXECUTING ABI INJECTION ]');
      const tx = prepareContractCall({
        contract: APF_POLICY_CONTRACT,
        method: "function submitProposal(string text)",
        params: [txPayload.payload]
      });

      try {
          const { transactionHash } = await sendTransaction({
            transaction: tx,
            account
          });
          console.info('[ SYSTEM: TX MINED ]', transactionHash);
          return transactionHash;
      } catch (err) {
          console.error('[ SYSTEM: TX EXCEPTION ]', err);
          throw err;
      }
    case 'EXECUTE_TREASURY_TRANSFER':
      console.info('[ SYSTEM: PROCESSOR READY FOR TREASURY ABI INJECTION ]');
      return Promise.resolve(true);
    default:
      console.info('[ SYSTEM: UNKNOWN COMMAND IN PROCESSOR ]');
      return Promise.resolve(true);
  }
};
