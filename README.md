# vibeos-source

## Building:

```npm install```

```node build```

run dist.html

## Creating the docs

Make sure you have installed all the modules with:

```npm install```

Run

```node docs```

Check ```./basefs/var/docs/```

## Making docs

See https://devdocs.io/jsdoc/tags-example for format

To add a file, add the path in build.json => docs

## todo:

- convert .png files to .webp automatically + routing .png files to .webp in filesystem

## FS

https://nodejs.org/api/fs.html

### todo:

- [fs.watch](https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener)

- [fs.watchFile](https://nodejs.org/api/fs.html#fs_fs_watchfile_filename_options_listener)

- most of filesystem classes

- [fs.promises](https://nodejs.org/api/fs.html#fs_fs_promises_api)