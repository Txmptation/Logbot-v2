const index = require('./index');

exports.getAllGuildTableNames = function () {

    return new Promise((resolve, reject) => {
        let query = `select table_name from information_schema.tables`;
        index.db.query(query, (err, rows, fields) => {
            if (err) {
                console.error(`Error while getting tables, Error: ${err.stack}`);
                reject(err);
                return;
            }

            let results = [];
            rows.forEach(table => {

                if (table.table_name.startsWith('id_')) results.push(table.table_name);
            });

            resolve(results);
        })
    })
};