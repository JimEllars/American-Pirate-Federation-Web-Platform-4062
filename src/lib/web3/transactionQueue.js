import { useAppStore } from '../../store/useAppStore';

const TX_QUEUE_KEY = 'apf_tx_queue';

export const getStoredQueue = () => {
  try {
    const stored = localStorage.getItem(TX_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const saveToQueue = (queue) => {
  try {
    localStorage.setItem(TX_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to save tx queue', e);
  }
};

export const enqueueTx = (actionPayload) => {
  const queue = getStoredQueue();
  const txRecord = {
    id: Date.now(),
    type: actionPayload.type,
    payload: actionPayload.payload,
    status: 'QUEUED',
    timestamp: new Date().toISOString()
  };
  queue.push(txRecord);
  saveToQueue(queue);
  return txRecord;
};

export const updateTxStatus = (id, newStatus) => {
  const queue = getStoredQueue();
  const index = queue.findIndex(tx => tx.id === id);
  if (index !== -1) {
    queue[index].status = newStatus;
    saveToQueue(queue);
  }
};

export const queueWeb3Transaction = async (actionPayload, thirdwebClient) => {
  console.info(`[ SYSTEM: TRANSACTION QUEUED FOR SIGNATURE - ${actionPayload.type} ]`);

  const txRecord = enqueueTx(actionPayload);

  try {
      useAppStore.getState().addToast(`[ TX QUEUED: ${actionPayload.type} ]`, 'info');

      // Simulate optimistic transitions
      setTimeout(() => {
          updateTxStatus(txRecord.id, 'BROADCASTING');
          useAppStore.getState().addToast(`[ TX BROADCASTED: Awaiting Confirmation ]`, 'warning');
      }, 1500);

      setTimeout(() => {
          updateTxStatus(txRecord.id, 'CONFIRMING');
      }, 2500);

      // Simulate success/failure for demonstration purposes (replace with real TX logic if available)
      setTimeout(() => {
          if (Math.random() > 0.1) {
              updateTxStatus(txRecord.id, 'FINALIZED');
              useAppStore.getState().addToast(`[ TX CONFIRMED: ${actionPayload.type} ]`, 'success');
          } else {
              updateTxStatus(txRecord.id, 'FAILED');
              useAppStore.getState().addToast(`[ TX FAILED: Reverted by EVM ]`, 'error');
          }
      }, 3500);

  } catch(e) {
      console.warn("Toast failed", e);
  }

  return { status: 'queued', id: txRecord.id };
};
