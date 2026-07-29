export const processQueuedTransaction = async (txPayload, thirdwebClient) => {
  switch (txPayload.command) {
    case 'DRAFT_POLICY':
    case 'EXECUTE_TREASURY_TRANSFER':
      console.info('[ SYSTEM: PROCESSOR READY FOR ABI INJECTION ]');
      break;
    default:
      console.info('[ SYSTEM: UNKNOWN COMMAND IN PROCESSOR ]');
      break;
  }
};
