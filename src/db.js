const humps = require('humps');

module.exports = (connection) => (
  require('knex')({
    client: 'pg',
    connection,
    postProcessResponse: result => humps.camelizeKeys(result),
    wrapIdentifier: (value, origImpl) => origImpl(humps.decamelize(value)),
  })
);
