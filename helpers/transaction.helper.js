const { Transaction } = require('../models');

/**
 * Retrieves a row from the tempTransactionDB, given a transaction ID.
 * @param {Object} req - Request object.
 * @param {Object} res - Response object.
 * @param {function} next - Next middleware.
 * @param {id} id - The ID of the transaction to be retrieved
 * @return {Object} - The transaction corresponding to the specified ID or undefined (its type
 *                    is technically object, but it has the functions of a sequelize instance)
 */
// eslint-disable-next-line consistent-return
const transactionByID = async (req, res, next, id) => {
  try {
    const transaction = await Transaction.findOne({
      where: {
        uuid: id,
      },
    })
      .then((data) => {
        if (!data) {
          return res.status(403).json({
            error: 'Invalid transaction ID',
          });
        }
        req.transaction = data;
        return next();
      })
      .catch((err) =>
        res.status(400).json({ error: 'Could not retrieve transaction' })
      );
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: 'Could not retrieve transaction' });
  }
};

const formatTransactions = (transactions) => {
  const formattedData = [];
  console.log(transactions);
  return transactions;
};

module.exports = { transactionByID, formatTransactions };
