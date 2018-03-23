const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry:  {
        script: './static/js/script.js'
    },
    output: {
        filename: '[name].bundle7.js',
        path: path.resolve(__dirname, 'static/build')
    },
    plugins: [
        new UglifyJSPlugin({
            mangle: true
        })
    ]
};
