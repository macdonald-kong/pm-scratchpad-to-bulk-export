const fs = require('fs');
const path = require('path');
const transformer = require('postman-collection-transformer');
const archiver = require('archiver');

// Get the collection file path from the command line arguments
const collectionFilePath = process.argv[2];

if (!collectionFilePath) {
    console.error('Please provide a Postman Scratchpad dump file path as a command line argument.');
    process.exit(1);
}

let collection;
try {
    collection = require(path.resolve(collectionFilePath));
} catch (err) {
    console.error(`Error loading Postman Scratchpad dump file ${collectionFilePath}:`, err);
    process.exit(1);
}

let options = {
    inputVersion: '1.0.0',
    outputVersion: '2.0.0',
    retainIds: true  // the transformer strips request-ids etc by default.
};

// Generate timestamped directory name
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = `output/${timestamp}`;
const collectionOutDir = path.join(outputDir, 'collection');
const environmentOutDir = path.join(outputDir, 'environment');
const archiveFilePath = path.join(outputDir, 'archive.json');

let archive = {
    environment: {},
    collection: {}
};

// Ensure the output directory exists
try {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    if (!fs.existsSync(collectionOutDir)) {
        fs.mkdirSync(collectionOutDir, { recursive: true });
    }
    if (!fs.existsSync(environmentOutDir)) {
        fs.mkdirSync(environmentOutDir, { recursive: true });
    }
} catch (err) {
    console.error(`Error creating directory:`, err);
    process.exit(1);
}

// Function to update the schema in the collection file
function updateSchema(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        let collection;
        try {
            collection = JSON.parse(data);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            return;
        }

        const oldSchema = "https://schema.getpostman.com/json/collection/v2.0.0/collection.json";
        const newSchema = "https://schema.postman.com/json/collection/v2.0.0/collection.json";

        if (collection.info && collection.info.schema === oldSchema) {
            collection.info.schema = newSchema;
            fs.writeFile(filePath, JSON.stringify(collection, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Error writing file:', writeErr);
                } else {
                    console.log('Schema updated successfully.');
                }
            });
        } else {
            console.log('Schema is already up to date.');
        }
    });
}

// Convert and save collections
collection.collections.forEach(function(coll){
    transformer.convert(coll, options, function (error, result) {
        if (error) {
            return console.error(error);
        }

        let content = JSON.stringify(result, null, 2);
        let index = 0;
        let name = result.info._postman_id + '.json';
        while(fs.existsSync(path.resolve(collectionOutDir, name))){
            name = result.info._postman_id + '_' + (++index) + '.json';
        }
        const collectionFilePath = path.resolve(collectionOutDir, name);
        fs.writeFileSync(collectionFilePath, content, 'utf-8');

        // Add collection ID to archive
        archive.collection[result.info._postman_id] = true;

        // Update schema if necessary
        updateSchema(collectionFilePath);
    });
});

// Save environments
collection.environments.forEach(function(env) {
    env._postman_variable_scope = "environment"; // Add the property here
    let content = JSON.stringify(env, null, 2);
    let index = 0;
    let name = env.id + '.json';
    while(fs.existsSync(path.resolve(environmentOutDir, name))){
        name = env.id + '_' + (++index) + '.json';
    }
    fs.writeFileSync(path.resolve(environmentOutDir, name), content, 'utf-8');

    // Add environment ID to archive
    archive.environment[env.id] = true;
});

// Write archive file
fs.writeFileSync(archiveFilePath, JSON.stringify(archive, null, 2), 'utf-8');

// Compress the output directory
const output = fs.createWriteStream(`${outputDir}.zip`);
const archiveZip = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
});

output.on('close', function() {
    console.log(`Archive created successfully: ${outputDir}.zip (${archiveZip.pointer()} total bytes)`);

    // Delete the uncompressed output directory
    fs.rm(outputDir, { recursive: true }, (err) => {
        if (err) {
            console.error(`Error deleting directory ${outputDir}:`, err);
        }
    });
});

archiveZip.on('error', function(err) {
    throw err;
});

archiveZip.pipe(output);
archiveZip.directory(outputDir, false);
archiveZip.finalize();