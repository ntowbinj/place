const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry:  {
        script: './static/js/script.js',
        midi: './static/js/midi.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'static/build')
    },
    plugins: [
        new UglifyJSPlugin({
            mangle: true
        })
    ]
};
