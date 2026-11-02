import { prepareContractCall, sendTransaction } from 'thirdweb';
import { PolicyContract as APF_POLICY_CONTRACT } from './contracts.js';
import { logTransactionDispatched, logOnChainSuccess, logOnChainRevert } from '../api/telemetry.js';

// Idempotency cache to prevent double processing of identical tx payloads
const activeTransactions = new Set();

export const processQueuedTransaction = async (txPayload, account) => {
  // Use payload ID or hash as an idempotency key
  const txKey = txPayload.id ? String(txPayload.id) : JSON.stringify(txPayload);

  if (activeTransactions.has(txKey)) {
      console.warn(`[ SYSTEM: TX ALREADY IN FLIGHT. SKIPPING DUPLICATE SUBMISSION ]`);
      return Promise.resolve("0xIDEMPOTENT_SKIPPED");
  }

  activeTransactions.add(txKey);

  try {
      switch (txPayload.command) {
        case 'DRAFT_POLICY':
          console.info('[ SYSTEM: PROCESSOR EXECUTING ABI INJECTION ]');
          logTransactionDispatched(null, { status: 'QUEUED', command: txPayload.command });

          if (!APF_POLICY_CONTRACT) {
            // Law 1 (Anti-Theater & Ground Truth): never return a fake transaction hash.
            // A hash that no chain produced is indistinguishable from a real one in the UI
            // and audit logs, so we fail loudly instead of simulating success.
            console.warn('[ SYSTEM: POLICY CONTRACT NOT CONFIGURED - TRANSACTION ABORTED ]');
            logTransactionDispatched(null, { status: 'UNAVAILABLE', command: txPayload.command });
            throw new Error('Policy contract is not configured. No transaction was submitted.');
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
        // REMOVED: 'EXECUTE_TREASURY_TRANSFER'. Model output is not a money-movement
        // channel (Architectural Law 2). Treasury funds live in an Arbitrum One Safe
        // multisig and can only move via owner-signed execTransaction calls, which this
        // processor has no business initiating from parsed AI text.
        default:
          console.info('[ SYSTEM: UNKNOWN COMMAND IN PROCESSOR ]');
          return Promise.resolve(true);
      }
  } finally {
      // Remove from active set after resolution or failure
      activeTransactions.delete(txKey);
  }
};
