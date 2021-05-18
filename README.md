# ![logo][] vibeOS
This repository contains the most current version of "new" vibeOS. This repository and the code within are private and not to be released until further notice. The following instructions are WIP by Divide.

[logo]: https://avatars.githubusercontent.com/u/74576368?s=50

## Building vibeOS 
The following instructions apply only to Windows. Instructions for other operating systems are available online at [vibeos.github.io](https://vibeos.github.io/gettingstarted.html).

1. Download and Install NodeJS from [nodejs.org](https://nodejs.org/en). Ensure "Add to PATH" is selected during setup. **You will need to reboot.**
2. Download and Install PowerShell 7 from the [GitHub Repository](https://github.com/powershell/powershell). **This also requires a reboot**.
3. Open PowerShell 7 by going to Windows Search and typing `pwsh`.
4. Use `cd` to move to the directory containing vibeOS.
5. Run `npm install`
6. Run `node build`
7. Open the `dist.html` file in your web browser. For vibeOS to function correctly, the `fs.bin` file will need to be in the same directory as `dist.html`.


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

- [fs.rename](https://nodejs.org/api/fs.html#fs_fs_rename_oldpath_newpath_callback)

- filesystem classes

- streams

- [fs.promises](https://nodejs.org/api/fs.html#fs_fs_promises_api)