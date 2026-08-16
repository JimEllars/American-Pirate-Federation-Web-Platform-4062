import { prepareContractCall, sendTransaction } from 'thirdweb';
import { PolicyContract as APF_POLICY_CONTRACT } from './contracts.js';
import { logTransactionDispatched, logOnChainSuccess, logOnChainRevert } from '../api/telemetry.js';

export const processQueuedTransaction = async (txPayload, account) => {
  switch (txPayload.command) {
    case 'DRAFT_POLICY':
      console.info('[ SYSTEM: PROCESSOR EXECUTING ABI INJECTION ]');
      logTransactionDispatched(null, { status: 'QUEUED', command: txPayload.command });

      if (!APF_POLICY_CONTRACT) {
        console.warn('[ SYSTEM: POLICY CONTRACT NOT CONFIGURED - TRANSACTION SIMULATED ]');
        return Promise.resolve("0xSIMULATED_PROPOSAL_HASH");
      }

      logTransactionDispatched(null, { status: 'PROCESSING', command: txPayload.command });
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
          logOnChainSuccess(transactionHash);
          logTransactionDispatched(transactionHash, { status: 'SUCCESS', command: txPayload.command, chainId: 42161 });
          return transactionHash;
      } catch (err) {
          console.error('[ SYSTEM: TX EXCEPTION ]', err);
          logOnChainRevert(err);
          logTransactionDispatched(null, { status: 'FAILED', command: txPayload.command, chainId: 42161 });
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
