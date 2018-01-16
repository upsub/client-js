import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'src/index.js',
  dest: 'dist/upsub-client.js',
  format: 'cjs',
  moduleName: 'Client',
  plugins: [
    commonjs(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
}
