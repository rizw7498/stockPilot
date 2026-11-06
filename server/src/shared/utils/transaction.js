const mongoose = require('mongoose');

const supportsTransactions = () => {
  const type = mongoose.connection.client?.topology?.description?.type;
  return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
};

const withTransaction = async (fn) => {
  if (supportsTransactions()) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await fn(session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } else {
    return await fn(undefined);
  }
};

module.exports = {
  supportsTransactions,
  withTransaction,
};
