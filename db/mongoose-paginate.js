/* Mongoose Paginate plugin

Forked from:
https://gist.github.com/craftgear/1525918

This snippet is inspired by edwardhotchkiss's mongoose-paginate 
(https://github.com/edwardhotchkiss/mongoose-paginate)
and works with any methods like where, desc, populate, etc.

The `paginate` method must be called at the end of method chains.

Example:

  require('./mongoose-paginate');

  var options = {
    limit: 10,
    offset: 0
  };

  model
    .find()
    .desc('_id')
    .populate('some_field')
    .paginate(options, function(err, total, docs) {
      console.log('total: ', total, 'docs :', docs);
    });

*/

var mongoose = require('mongoose');

var DEFAULT_LIMIT = 10;

/* Example `options`:

  {limit: 10, offset: 10}

or

  {limit: 10, page: 2}

If both `page` and `offset` are present, `offset` is used.
*/
mongoose.Query.prototype.paginate = function(options, cb) {
  var query = this,
      model = this.model,
      limit,
      offset;

  if (!options) options = {};
  limit = (typeof options.limit === 'number') ? options.limit : DEFAULT_LIMIT;
  if (typeof options.offset === 'number') {
    offset = options.offset;
  }
  else if (typeof options.page === 'number') {
    offset = (options.page * limit) - limit;
  } else {
    offset = 0;
  }
  
  console.log("offset:" + offset + " limit:" + limit);
  query = query.skip(offset).limit(limit);
  if (cb) {
    query.exec(function(err, docs) {
      if (err) {
        cb(err, null, null);
      } else {
        model.count(query._conditions, function(err, count) {
          cb(null, count, docs);
        });
      }
    });
  } else {
    throw new Error('pagination needs a callback as the third argument.');
  }
};
