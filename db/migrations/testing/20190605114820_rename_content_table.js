exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.hasColumn("form_meta", "form_meta_type").then(function(exists) {
      if (exists) {
        return knex.schema.table("form_meta", function(t) {
          t.renameColumn("form_meta_type", "content_type");
        });
      }
    }),
    knex.schema.hasTable("form_meta").then(function(exists) {
      if (exists) {
        return knex.schema.renameTable("form_meta", "content");
      }
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.hasTable("content").then(function(exists) {
      if (exists) {
        return (
          knex.schema.alterTable("content", function(t) {
            t.renameColumn("content_type", "form_meta_type");
          }),
          knex.schema.renameTable("content", "form_meta")
        );
      }
    })
  ]);
};
