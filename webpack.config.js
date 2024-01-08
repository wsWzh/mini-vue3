const path = require('path');

module.exports = {
    mode: 'development',
    devtool: false,
    // devtool: 'inline-cheap-source-map',
    entry: './src/index.js',
    output: {
        filename: 'mini-vue.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        // publicPath: '/dist',//资源如果放到CDN地址 直接相对路径访问不到 http:123.23.123 开发最好不要在这里配会影响打包结果
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'src/examples'),
        },
        // 中间件
        devMiddleware: {
            publicPath: '/dist',//默认值output.publicPath
        },
        watchFiles: {
            paths: ['src/examples'],
        },
    },
};