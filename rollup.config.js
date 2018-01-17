import babel from 'rollup-plugin-babel'
import alias from 'rollup-plugin-alias'
import builtins from 'rollup-plugin-node-builtins'

export default {
  input: 'src/index.js',
  output: {
    name: 'Client',
    file: 'dist/client.js',
    format: 'iife'
  },
  plugins: [
    builtins(),
    babel({
      exclude: 'node_modules/**'
    }),
    alias({
      'ws': './NativeWebSocket.js'
    })
  ]
}
