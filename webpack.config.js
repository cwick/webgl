const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

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
                test: /\.ts$/,
                use: { loader: 'ts-loader', options: { appendTsSuffixTo: [/\.vue$/] } },
                exclude: /node_modules/,
            },
            {
                test: /\.gltf$/,
                use: 'json-loader',
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
        ],
    },
    plugins: [
        // make sure to include the plugin!
        new VueLoaderPlugin(),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.vue'],
        modules: [path.resolve(__dirname), 'node_modules'],
    },
};
