export const queueWeb3Transaction = async (actionPayload, thirdwebClient) => {
  console.info(`[ SYSTEM: TRANSACTION QUEUED FOR SIGNATURE - ${actionPayload.type} ]`);
  return { status: 'queued' };
};
