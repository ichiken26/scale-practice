import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'
export default[
  {ignores:['dist/**','.astro/**','node_modules/**','coverage/**','playwright-report/**']},
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked.map(config=>({...config,files:['**/*.ts'],languageOptions:{...config.languageOptions,parserOptions:{projectService:true,tsconfigRootDir:import.meta.dirname}}})),
  ...pluginVue.configs['flat/recommended'],
  {files:['**/*.vue'],languageOptions:{parser:vueParser,parserOptions:{parser:tseslint.parser,projectService:true,extraFileExtensions:['.vue'],tsconfigRootDir:import.meta.dirname}},rules:{'no-unused-vars':'off','@typescript-eslint/no-unused-vars':'off','vue/max-attributes-per-line':'off','vue/singleline-html-element-content-newline':'off','vue/html-self-closing':'off','vue/html-indent':'off','vue/multi-word-component-names':'off','vue/mustache-interpolation-spacing':'off','vue/html-closing-bracket-spacing':'off'}},
  {languageOptions:{globals:{...globals.browser,...globals.worker,...globals.node}},rules:{'@typescript-eslint/no-non-null-assertion':'off','@typescript-eslint/restrict-template-expressions':'off','@typescript-eslint/no-confusing-void-expression':'off','@typescript-eslint/no-unnecessary-condition':'off','@typescript-eslint/no-unnecessary-type-assertion':'off'}}
]
