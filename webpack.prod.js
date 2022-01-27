const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: 'production',
  entry: {
    interpreter: "./src/interpreter/main.ts",
    codemirror: "./src/codemirror/main.ts",
    assets: "./src/assets/main.ts"
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist/"),
    publicPath: "./"
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        path.resolve(__dirname, "src", "favicon.svg")
      ],
    }),
    new HtmlWebpackPlugin({
      template: "src/index.html",
      minify: true
    })
  ]
};
