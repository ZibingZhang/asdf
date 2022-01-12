const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    assets: "./src/assets/main.ts",
    interpreter: "./src/interpreter/main.ts",
    codemirror: "./src/codemirror/main.js"
  },
  mode: 'development',
  devtool: "eval",
  devServer: {
    hot: true
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
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist/"),
    publicPath: "./"
  },
  plugins: [new HtmlWebpackPlugin({
    template: "src/index.html"
  })]
};
