module.exports = {
  productionSourceMap: false,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000'
      },
      '/sign': {
        target: 'http://localhost:3000'
      },
      '/state': {
        target: 'http://localhost:3000'
      }
    }
  }
};