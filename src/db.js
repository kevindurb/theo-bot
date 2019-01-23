module.exports = (connection) => (
  require('knex')({
    client: 'pg',
    connection,
  })
);
