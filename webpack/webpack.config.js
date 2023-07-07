const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
   mode: "production",
   entry: {
      content_script_main: path.resolve(__dirname, "..", "src", "content_script_main.ts"),
      service_worker: path.resolve(__dirname, "..", "src", "service_worker.ts"),
      popup_main: path.resolve(__dirname, "..", "src", "popup_main.ts"),
   },
   output: {
      path: path.join(__dirname, "../dist"),
      filename: "[name].js",
   },
   resolve: {
      extensions: [".ts", ".js"],
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
         },
      ],
   },
   optimization: {
    minimize: false
   },
   plugins: [
      new CopyPlugin({
         patterns: [{from: ".", to: ".", context: "public"}]
      }),
   ],
};