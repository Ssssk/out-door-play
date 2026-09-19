// 以相对路径引入 wot-design-uni 的全局组件类型。
// 原先该声明通过 tsconfig 的 `types: ["wot-design-uni/global.d.ts"]` 引入，
// 部分 TS 语言服务（如编辑器内置 TS）解析该包子路径会失败并报 TS2688，
// 改用相对路径可保证在任何模块解析模式下都能稳定加载。
/// <reference path="../../node_modules/wot-design-uni/global.d.ts" />
