import builtins from 'rollup-plugin-node-builtins'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import alias from 'rollup-plugin-alias'

export default {
  input: 'src/index.js',
  output: {
    name: 'Client',
    file: 'dist/client.js',
    format: 'iife'
  },
  plugins: [
    builtins(),
    commonjs(),
    babel({
      exclude: 'node_modules/**'
    }),
    alias({
      'ws': './NativeWebSocket.js'
    })
  ]
}
