const path = require('path');

module.exports = {
    devServer: {
        hot: true,
        compress: true,
    },
    devtool: 'source-map',
    entry: './src/index.ts',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.gltf$/,
                use: 'json-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        modules: [path.resolve(__dirname), 'node_modules'],
    },
};
