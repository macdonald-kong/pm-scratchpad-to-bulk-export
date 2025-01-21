# Postman Scratchpad to Bulk Export

This project transforms Postman Scratchpad dump files from version 1.0.0 to version 2.0.0, retains IDs, and organizes the output into timestamped directories. The output directory is then compressed into a zip file.

## Prerequisites

- Node.js (>= 12.x)
- npm (>= 6.x)

## Installation

1. Clone the repository:

```sh
git clone https://github.com/macdonald-kong/pm-scratchpad-to-bulk-export
cd postman-transformer
```

2. Install the dependencies:

```sh
npm install
```

## Usage

1. Run the script with the path to the Postman Scratchpad dump file as a command line argument:

```sh
node app.js /path/to/Backup.postman_dump.json
```

2. The script will create a timestamped directory in the [output](http://_vscodecontentref_/0) folder, containing the transformed collections and environments, along with an [archive.json](http://_vscodecontentref_/1) file. The directory will then be compressed into a zip file and the original directory will be deleted.

## Example

```sh
node app.js ./examples/Backup.postman_dump.json
```

This will generate a zip file in the output directory with a name like output/2025-01-21T10-50-07-648Z.zip.

## Project Structure

- app.js: Main script to transform and organize Postman collections and environments.
- examples: Directory containing example Postman Scratchpad dump files.
- output: Directory where the output zip files will be stored.

## Dependencies

- postman-collection-transformer: Used to transform Postman collections.
- archiver: Used to compress the output directory into a zip file.

## License
This project is licensed under the Apache 2.0 License.

