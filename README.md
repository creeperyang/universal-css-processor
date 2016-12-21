# universal-css-processor

> Process sass/less/postcss and generate sourcemap correctly.

## Installation

```bash
npm i --save universal-css-processor
```

## Usage

`universal-css-processor` offers a simple and universal API to handle `less/sass/postcss` and generate sourcemap.

And built-in processors include `less/sass/postcss/autoprefixer/minify/concat/css`.

The typical usage is below:

```js
const ucprocessor = require('universal-css-processor')

ucprocessor.process(
    // glob to list files you want to handle
    ['test/resource/sass/*.scss', '!test/resource/sass/_*.scss'],
    [
        'sass', // directly specify sass processor
        {
            name: 'autoprefixer' // use name to specify processor
        },
        {
            name: 'concat',
            // offer options
            options: {
                destFile: 'all.css'
            }
        },
        {
            name: 'minify',
            options: {
                rename: true
            }
        }
    ],
    {
        map: true // generate map
    }
).then(file => {
    // regroup map file
    return ucprocessor.writeMap(file, '.', {
        destPath: 'dest'
    }).then(mapFile => {
        // write map file and processed style file to disk
        mapFile.dest('dest')
        file.dest('dest')
    })
})
```

## Credits

Surely inspired by `gulp` and its plugins like `gulp-sourcemaps`, `gulp-postcss`, `gulp-sass` and `gulp-concat`. Most part of code is rewrited based on their codebase, and thanks for their great work.

The goal for this lib is integrating and simplifying the process of style and sourcemap.
