import mongoose from "mongoose";

/**
 * Run a callback inside a MongoDB transaction.
 * Falls back to non-transactional execution when transactions are unsupported (standalone dev).
 */
export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export default withTransaction;
