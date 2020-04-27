let path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports= {
    mode:"development",
    entry: './src/index.js',
    output: {
        filename: "app.js",
        path: path.resolve(__dirname,"dist")
    },
    optimization: {
        minimize:true,
        minimizer:[new TerserPlugin({
            test: /\.js$/,
        })],
    },
}