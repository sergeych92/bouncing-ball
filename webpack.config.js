const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        contentBase: './dist'
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.s(a|c)ss$/,
                loader: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            }
        ]
    },
    mode: 'development',
    plugins: [
        new HTMLWebpackPlugin({
            template: './src/index.html', //source
            filename: 'index.html'  //destination
        })
    ]
};
